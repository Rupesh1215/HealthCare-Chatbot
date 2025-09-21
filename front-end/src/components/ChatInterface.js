import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import { useSpeechRecognitionHook } from '../hooks/useSpeechRecognition';
import { speechSynthesizer } from '../utils/speechSynthesis';
import './ChatInterface.css';

const ChatInterface = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();
  const videoRef = useRef(null);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    supportedLanguages,
    selectedLanguage,
    setSelectedLanguage,
    browserSupportsSpeechRecognition
  } = useSpeechRecognitionHook(handleSpeechResult);

  // Initialize speech synthesis and video background
  useEffect(() => {
    speechSynthesizer.init();
    
    // Setup video background
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(console.error);
    }
  }, []);

  function handleSpeechResult(text, language) {
    if (text.trim().length > 0) {
      setInputMessage(text);
      handleSendMessage(null, text);
    }
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(selectedLanguage);
    }
  };

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setShowLanguageMenu(false);
    if (isListening) {
      stopListening();
      startListening(languageCode);
    }
  };

  const speakMessage = async (text) => {
    if (!text || isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      await speechSynthesizer.speak(text, selectedLanguage);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
    setIsSpeaking(false);
  };

  const stopSpeaking = () => {
    speechSynthesizer.stop();
    setIsSpeaking(false);
  };

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

  const formatMessageWithLineBreaks = (text) => {
    if (typeof text !== 'string') return text;
    
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
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
      const newMessage = {
        id: Date.now(),
        text: renderSafeContent(data.message),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      speakMessage(renderSafeContent(data.message));
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
      stopSpeaking();
      stopListening();
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

  const handleSendMessage = (e, speechText = null) => {
    if (e) e.preventDefault();
    
    const messageText = speechText || inputMessage;
    if (messageText.trim() === '') return;

    const newMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    if (socketRef.current) {
      socketRef.current.emit('user_message', {
        message: messageText,
        userId: user?.id,
        language: selectedLanguage
      });
    }
  };

  const getLanguageName = (code) => {
    const lang = supportedLanguages.find(l => l.code === code);
    return lang ? lang.nativeName : code;
  };

  return (
    <div className="chat-container">
      {/* Video Background */}
      <div className="video-background">
        <video
          ref={videoRef}
          className="background-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/medical-background.mp4" type="video/mp4" />
          <source src="/videos/medical-background.webm" type="video/webm" />
        </video>
        <div className="video-overlay"></div>
      </div>

      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">
              <div className="rotating-plus">+</div>
            </div>
            <h2>Health Assistant</h2>
          </div>
        </div>
        
        <div className="header-center">
          <div className="user-info">
            <span className="welcome-text">Welcome,</span>
            <span className="user-name">{user?.name || 'User'}</span>
          </div>
        </div>
        
        <div className="header-right">
          <div className="connection-status-wrapper">
            <div className={`status-dot ${connectionStatus}`}></div>
            <span className="status-text">
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="language-selector">
            <button 
              className="language-btn"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              title="Select Language"
            >
              <span className="language-icon">🌐</span>
              <span className="language-text">{getLanguageName(selectedLanguage)}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {showLanguageMenu && (
              <div className="language-menu">
                <div className="language-menu-header">
                  <h4>Select Language</h4>
                </div>
                {supportedLanguages.map((language) => (
                  <button
                    key={language.code}
                    className={`language-option ${selectedLanguage === language.code ? 'selected' : ''}`}
                    onClick={() => handleLanguageSelect(language.code)}
                  >
                    <span className="option-flag">{language.nativeName.includes('हिन्दी') ? '🇮🇳' : 
                      language.nativeName.includes('తెలుగు') ? '🇮🇳' : '🌐'}</span>
                    <span className="option-text">
                      <span className="native-name">{language.nativeName}</span>
                      <span className="english-name">{language.name}</span>
                    </span>
                    {selectedLanguage === language.code && (
                      <span className="checkmark">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">💬</div>
            <h3>Start Your Health Consultation</h3>
            <p>Describe your symptoms or ask any health-related questions</p>
            <div className="empty-features">
              <div className="feature">
                <span className="feature-icon">🎤</span>
                <span>Voice input supported</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🌐</span>
                <span>Multiple languages</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⚕️</span>
                <span>Professional medical advice</span>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-content">
                <div className="message-avatar">
                  {message.sender === 'user' ? '👤' : '⚕️'}
                </div>
                <div className="message-bubble">
                  <div className="message-text">
                    {formatMessageWithLineBreaks(renderSafeContent(message.text))}
                  </div>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="message bot-message typing-message">
            <div className="message-content">
              <div className="message-avatar">⚕️</div>
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span>Dr. CareBot is typing</span>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div className="input-wrapper">
            <div className="input-field">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Describe your symptoms or ask a question... (${getLanguageName(selectedLanguage)})`}
                disabled={isTyping}
                className="message-input"
              />
              
              <div className="input-actions">
                {browserSupportsSpeechRecognition && (
                  <button
                    type="button"
                    className={`action-btn mic-btn ${isListening ? 'listening' : ''}`}
                    onClick={handleMicClick}
                    disabled={isTyping}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    <span className="btn-icon">{isListening ? '⏹️' : '🎤'}</span>
                    <span className="btn-tooltip">
                      {isListening ? 'Stop Listening' : 'Voice Input'}
                    </span>
                  </button>
                )}
                
                <button
                  type="button"
                  className={`action-btn speaker-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={stopSpeaking}
                  disabled={!isSpeaking}
                  title="Stop speech"
                >
                  <span className="btn-icon">🔇</span>
                  <span className="btn-tooltip">Stop Speech</span>
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isTyping || inputMessage.trim() === ''}
              className="send-button"
            >
              <span className="send-icon">➤</span>
              <span className="send-text">Send</span>
            </button>
          </div>
        </form>

        {isListening && (
          <div className="speech-indicator">
            <div className="pulse-ring"></div>
            <div className="speech-text">
              <span className="listening-text">Listening...</span>
              <span className="transcript">{transcript}</span>
            </div>
            <button 
              className="stop-listening-btn"
              onClick={stopListening}
              title="Stop listening"
            >
              ⏹️
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;