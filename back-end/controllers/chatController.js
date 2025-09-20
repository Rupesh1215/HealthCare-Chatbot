const db = require('../config/database');
const auth = require('../middleware/auth');

const chatController = {
  getChatHistory: async (req, res) => {
    try {
      const userId = req.user.id; // This should be set by the auth middleware
      const connection = await db.getConnection();
      
      const result = await connection.execute(
        `SELECT chat_id, user_id, query, response, timestamp FROM ChatHistory WHERE user_id = :userId ORDER BY timestamp DESC`,
        [userId]
      );
      
      const chats = result.rows.map(row => ({
        chat_id: row[0],
        user_id: row[1],
        query: String(row[2]),
        response: String(row[3]),
        timestamp: row[4]
      }));
      
      res.json(chats);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  saveChat: async (userId, query, response) => {
    try {
      const connection = await db.getConnection();
      
      const safeQuery = typeof query === 'string' ? query : JSON.stringify(query);
      const safeResponse = typeof response === 'string' ? response : JSON.stringify(response);
      
      await connection.execute(
        `INSERT INTO ChatHistory (user_id, query, response) VALUES (:user_id, :query, :response)`,
        {
          user_id: userId,
          query: safeQuery,
          response: safeResponse
        }
      );
      
      await connection.commit();
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  }
};

module.exports = chatController;