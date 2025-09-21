import React, { useState, useEffect } from 'react';
import './ChatHistory.css';

const ChatHistory = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Safe content rendering function
  const renderSafeContent = (content) => {
    if (typeof content === 'string') return content;
    if (typeof content === 'number') return content.toString();
    if (typeof content === 'object' && content !== null) {
      try {
        return JSON.stringify(content);
      } catch (e) {
        return String(content);
      }
    }
    return String(content);
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/chat/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const history = await response.json();
        setChats(history);
      } else {
        setError('Failed to fetch chat history');
      }
    } catch (error) {
      setError('Error fetching chat history');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (loading) return <div className="loading">Loading chat history...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="chat-history-container">
      <h2>Chat History</h2>
      
      {chats.length === 0 ? (
        <div className="empty-history">
          <p>No chat history found.</p>
        </div>
      ) : (
        <div className="chat-list">
          {chats.map(chat => (
            <div key={chat.chat_id} className="chat-item">
              <div className="chat-header">
                <span className="chat-date">{formatDate(chat.timestamp)}</span>
              </div>
              <div className="chat-content">
                <div className="user-query">
                  <strong>You:</strong> 
                  <div className="query-text">{renderSafeContent(chat.query)}</div>
                </div>
                <div className="bot-response">
                  <strong>Health Assistant:</strong>
                  <div 
                    className="response-text" 
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {renderSafeContent(chat.response)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHistory;