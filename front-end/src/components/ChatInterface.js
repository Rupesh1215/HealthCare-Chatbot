import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import './ChatInterface.css';

const ChatInterface = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  const socketRef = useRef();

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

  // Function to format message with line breaks and bold text
  const formatMessageWithLineBreaks = (text) => {
    if (typeof text !== 'string') return text;
    
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Handle bold formatting (**text**)
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const formattedLine = parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i}>{part}</strong>;
        }
        return part;
      });
      
      return (
        <React.Fragment key={index}>
          {formattedLine}
          <br />
        </React.Fragment>
      );
    });
  };

  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
    });

    socketRef.current.on('chat_message', (data) => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: renderSafeContent(data.message),
        sender: 'bot',
        timestamp: new Date()
      }]);
    });

    socketRef.current.on('bot_typing', () => {
      setIsTyping(true);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "Sorry, I'm having trouble connecting. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      }]);
    });

    fetchChatHistory();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        const formattedHistory = history.map(chat => ({
          id: chat.chat_id || Date.now(),
          text: renderSafeContent(chat.query),
          sender: 'user',
          timestamp: new Date(chat.timestamp),
          response: renderSafeContent(chat.response)
        }));
        setMessages(formattedHistory);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    if (socketRef.current) {
      socketRef.current.emit('user_message', {
        message: inputMessage,
        userId: user?.id
      });
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h2>Health Assistant</h2>
        <div className="user-info">
          <span>Hello, {user?.name || 'User'}</span>
          <span className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </header>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Start a conversation with your health assistant!</p>
            <p>You can ask about symptoms, medications, or general health advice.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-content">
                <div className="message-text">
                  {formatMessageWithLineBreaks(renderSafeContent(message.text))}
                </div>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="message bot-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your health question here..."
          disabled={isTyping}
        />
        <button type="submit" disabled={isTyping || inputMessage.trim() === ''}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;