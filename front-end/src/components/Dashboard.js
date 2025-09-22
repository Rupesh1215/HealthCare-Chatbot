// components/Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const tips = [
  "Stay hydrated by drinking at least 8 glasses of water daily",
  "Get 7-9 hours of quality sleep each night",
  "Include physical activity in your daily routine",
  "Eat a balanced diet with plenty of fruits and vegetables"
];

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    const container = document.querySelector('.dashboard-container');
    if (!container) return;
    container.classList.add('fade-scale-out');
    container.addEventListener(
      'animationend',
      () => navigate(path),
      { once: true }
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-float">
        <div className="dashboard-header-gradient"></div>
        <h1>
          <span className="pulse-logo">🍃</span> Health Assistant
        </h1>
        <div className="user-menu float">
          <span className="user-welcome-text">Welcome, {user?.name}</span>
          <button
            onClick={() => {
              onLogout();
              // Optional: Animate fade scale out on logout too
              const container = document.querySelector('.dashboard-container');
              if (container) container.classList.add('fade-scale-out');
            }}
            className="logout-btn lift-hover fixed-size-btn"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section fade-in">
          <h2>How can we help you today?</h2>
          <p>Get personalized health advice and information from our AI assistant.</p>
        </div>

        <div className="action-cards">
          {[
            {
              icon: '💬',
              title: 'Start Chat',
              desc: 'Chat with our health assistant about your symptoms or concerns',
              path: '/chat',
            },
            {
              icon: '👤',
              title: 'My Profile',
              desc: 'View and update your personal information and medical history',
              path: '/profile',
            },
            {
              icon: '📋',
              title: 'Chat History',
              desc: 'Review your previous conversations with the health assistant',
              path: '/history',
            },
          ].map(({ icon, title, desc, path }, idx) => (
            <div
              key={title}
              role="button"
              tabIndex={0}
              onClick={() => handleNavigation(path)}
              onKeyPress={(e) => e.key === 'Enter' && handleNavigation(path)}
              className="action-card fade-up lift-hover clickable fixed-size-card"
              style={{ animationDelay: `${0.1 + idx * 0.15}s` }}
            >
              <div className="card-icon bounce">{icon}</div>
              <h3 className="emitting-text">{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>

        <div className="quick-tips glass-float fade-up" style={{ animationDelay: '0.6s' }}>
          <div className="tips-gradient"></div>
          <h3>Health Tips</h3>
          <ul>
            {tips.map((tip, idx) => (
              <li
                key={idx}
                className="fade-in"
                style={{ animationDelay: `${0.7 + idx * 0.09}s` }}
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
