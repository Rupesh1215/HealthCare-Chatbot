// components/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Health Assistant</h1>
        <div className="user-menu">
          <span>Welcome, {user?.name}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>How can we help you today?</h2>
          <p>Get personalized health advice and information from our AI assistant.</p>
        </div>
        
        <div className="action-cards">
          <Link to="/chat" className="action-card">
            <div className="card-icon">💬</div>
            <h3>Start Chat</h3>
            <p>Chat with our health assistant about your symptoms or concerns</p>
          </Link>
          
          <Link to="/profile" className="action-card">
            <div className="card-icon">👤</div>
            <h3>My Profile</h3>
            <p>View and update your personal information and medical history</p>
          </Link>
          
          <Link to="/history" className="action-card">
            <div className="card-icon">📋</div>
            <h3>Chat History</h3>
            <p>Review your previous conversations with the health assistant</p>
          </Link>
        </div>
        
        <div className="quick-tips">
          <h3>Health Tips</h3>
          <ul>
            <li>Stay hydrated by drinking at least 8 glasses of water daily</li>
            <li>Get 7-9 hours of quality sleep each night</li>
            <li>Include physical activity in your daily routine</li>
            <li>Eat a balanced diet with plenty of fruits and vegetables</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;