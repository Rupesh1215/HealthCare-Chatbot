const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Use environment variable with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only_change_in_production';

const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password, age, medicalHistory } = req.body;
      
      // Get database connection
      const connection = await db.getConnection();
      
      // Check if user already exists
      const result = await connection.execute(
        `SELECT * FROM Users WHERE email = :email`,
        [email]
      );
      
      if (result.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Insert new user
      await connection.execute(
        `INSERT INTO Users (name, email, password_hash, age, medical_history) 
         VALUES (:name, :email, :password_hash, :age, :medical_history)`,
        {
          name: name,
          email: email,
          password_hash: hashedPassword,
          age: age,
          medical_history: medicalHistory
        }
      );
      
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Get database connection
      const connection = await db.getConnection();
      
      // Find user by email
      const result = await connection.execute(
        `SELECT * FROM Users WHERE email = :email`,
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Extract user data from result
      const userRow = result.rows[0];
      const user = {
        id: userRow[0],
        name: userRow[1],
        email: userRow[2],
        password_hash: userRow[3],
        age: userRow[4],
        medical_history: userRow[5],
        created_at: userRow[6]
      };
      
      // Check password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Generate JWT token using the JWT_SECRET
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          age: user.age,
          medicalHistory: user.medical_history,
          created_at: user.created_at
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = authController;