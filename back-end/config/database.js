const oracledb = require('oracledb');

// Store the database connection
let dbConnection = null;

// Function to create necessary tables
async function createTables(connection) {
  try {
    // Create Users table
    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE Users (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          name VARCHAR2(100) NOT NULL,
          email VARCHAR2(100) UNIQUE NOT NULL,
          password_hash VARCHAR2(255) NOT NULL,
          age NUMBER,
          medical_history CLOB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN -- table already exists
            RAISE;
          END IF;
      END;
    `);
    
    // Create ChatHistory table
    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE ChatHistory (
          chat_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id NUMBER NOT NULL,
          query CLOB NOT NULL,
          response CLOB,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES Users(id)
        )';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN -- table already exists
            RAISE;
          END IF;
      END;
    `);
    
    // Create Logs table
    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE Logs (
          log_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id NUMBER,
          action VARCHAR2(255) NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES Users(id)
        )';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN -- table already exists
            RAISE;
          END IF;
      END;
    `);
    
    console.log("Tables verified/created successfully");
    await connection.commit();
  } catch (err) {
    console.error("Error creating tables:", err);
  }
}

// Create mock database connection for development
function createMockConnection() {
  const mockUsers = [];
  const mockChatHistory = [];
  let userIdCounter = 1;
  let chatIdCounter = 1;
  
  return {
    execute: async (query, params = {}) => {
      console.log("DB Query:", query, params);
      
      // Handle INSERT into Users
      if (query.includes('INSERT INTO Users')) {
        const newUser = {
          id: userIdCounter++,
          name: params.name || params[0],
          email: params.email || params[1],
          password_hash: params.password_hash || params[2],
          age: params.age || params[3],
          medical_history: params.medical_history || params[4],
          created_at: new Date()
        };
        mockUsers.push(newUser);
        return { rows: [] };
      }
      
      // Handle SELECT from Users by email
      if (query.includes('SELECT * FROM Users WHERE email')) {
        const email = params.email || params[0];
        const user = mockUsers.find(u => u.email === email);
        return { rows: user ? [[user.id, user.name, user.email, user.password_hash, user.age, user.medical_history, user.created_at]] : [] };
      }
      
      // Handle SELECT from ChatHistory by user_id
      if (query.includes('SELECT * FROM ChatHistory WHERE user_id')) {
        const userId = params.userId || params[0];
        const userChats = mockChatHistory.filter(chat => chat.user_id === userId);
        return { rows: userChats.map(chat => [chat.chat_id, chat.user_id, chat.query, chat.response, chat.timestamp]) };
      }
      
      // Handle INSERT into ChatHistory
      if (query.includes('INSERT INTO ChatHistory')) {
        const newChat = {
          chat_id: chatIdCounter++,
          user_id: params.user_id || params[0],
          query: params.query || params[1],
          response: params.response || params[2],
          timestamp: new Date()
        };
        mockChatHistory.push(newChat);
        return { rows: [] };
      }
      
      // Handle UPDATE Users
      if (query.includes('UPDATE Users')) {
        const userId = params.userId || params[4];
        const userIndex = mockUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          mockUsers[userIndex] = {
            ...mockUsers[userIndex],
            name: params.name || params[0],
            email: params.email || params[1],
            age: params.age || params[2],
            medical_history: params.medicalHistory || params[3]
          };
        }
        return { rows: [] };
      }
      
      // Default response for other queries
      return { rows: [] };
    },
    close: async () => {
      console.log("Database connection closed");
    },
    commit: async () => {
      console.log("Transaction committed");
    }
  };
}

// Create a safe wrapper around the connection
function createSafeConnectionWrapper(connection) {
  return {
    execute: async (query, params = {}) => {
      try {
        const result = await connection.execute(query, params);
        // Return only the data, not the connection object
        return { 
          rows: result.rows || [],
          metaData: result.metaData || []
        };
      } catch (error) {
        console.error('Database query error:', error);
        throw error;
      }
    },
    close: async () => {
      try {
        await connection.close();
        console.log("Database connection closed");
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    },
    commit: async () => {
      try {
        await connection.commit();
        console.log("Transaction committed");
      } catch (error) {
        console.error('Error committing transaction:', error);
      }
    }
  };
}

async function initialize() {
  try {
    // Try to connect to Oracle XE
    const connection = await oracledb.getConnection({
      user: "system",
      password: "mydbms123",
      connectString: "localhost:1521/XE"
    });
    
    console.log("Connected to Oracle Database XE");
    
    // Create tables if they don't exist
    await createTables(connection);
    
    // Return a safe wrapper, not the raw connection
    return createSafeConnectionWrapper(connection);
  } catch (err) {
    console.error("Database connection error:", err);
    console.log("Using mock database due to connection error");
    return createMockConnection();
  }
}

async function closeConnection() {
  if (dbConnection) {
    await dbConnection.close();
    dbConnection = null;
  }
}

async function getConnection() {
  if (!dbConnection) {
    dbConnection = await initialize();
  }
  return dbConnection;
}

module.exports = {
  initialize,
  close: closeConnection,
  getConnection
};