const db = require('../config/database');

const userController = {
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, email, age, medicalHistory } = req.body;
      const connection = await db.getConnection();
      
      await connection.execute(
        `UPDATE Users SET name = :name, email = :email, age = :age, medical_history = :medicalHistory 
         WHERE id = :userId`,
        {
          name: name,
          email: email,
          age: age,
          medicalHistory: medicalHistory,
          userId: userId
        },
        { autoCommit: true }
      );
      
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = userController;