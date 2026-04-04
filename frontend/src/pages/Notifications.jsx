import React, { useState, useEffect } from 'react';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/notifications');
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'follow':
        return (
          <div className="icon-follow">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
          </div>
        );
      case 'like':
        return (
          <div className="icon-like">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
        );
      case 'comment':
        return (
          <div className="icon-comment">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getMessage = (notif) => {
    switch (notif.type) {
      case 'follow':
        return <span><strong>{notif.user.name}</strong> started following you</span>;
      case 'like':
        return <span><strong>{notif.user.name}</strong> liked your story <span className="notification-target">{notif.target}</span></span>;
      case 'comment':
        return <span><strong>{notif.user.name}</strong> commented on <span className="notification-target">{notif.target}</span></span>;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="notifications-container">
          <div className="notifications-header">
            <h1>Notifications</h1>
          </div>
          <div className="loading-state">
            <p>Loading your updates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="notifications-container">
        <div className="notifications-header">
          <h1>Notifications</h1>
          {notifications.length > 0 && (
            <button className="mark-read-btn">Mark all as read</button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-icon">🔔</div>
            <h3>All caught up!</h3>
            <p>No new notifications at the moment.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notif, index) => (
              <div 
                key={notif.id} 
                className={`notification-item ${notif.read ? '' : 'unread'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img 
                  src={notif.user.avatar} 
                  alt={notif.user.name} 
                  className="notification-avatar" 
                />
                <div className="notification-content">
                  <div className="notification-message">
                    {getMessage(notif)}
                  </div>
                  <div className="notification-time">
                    {formatDate(notif.timestamp)}
                  </div>
                  {notif.type === 'comment' && notif.content && (
                    <div className="notification-comment-preview">
                      "{notif.content}"
                    </div>
                  )}
                </div>
                <div className="notification-icon">
                  {getIcon(notif.type)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
