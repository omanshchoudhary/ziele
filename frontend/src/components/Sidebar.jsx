import React from 'react';
import './Sidebar.css';

function Sidebar() {
  const trending = [
    { topic: "Technology", posts: "125k", tag: "#FutureTech" },
    { topic: "Programming", posts: "82k", tag: "#Javascript" },
    { topic: "Design", posts: "45k", tag: "#WebDesign" },
    { topic: "Business", posts: "30k", tag: "#Startup" },
  ];

  const suggestions = [
    { name: "John Doe", handle: "@johndoe", avatar: "JD" },
    { name: "Jane Smith", handle: "@janesmith", avatar: "JS" },
    { name: "Alex Rivera", handle: "@arivera", avatar: "AR" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-section trending-section">
        <h3>What's happening</h3>
        {trending.map((item, i) => (
          <div key={i} className="trending-item">
            <span className="trending-tag">{item.tag}</span>
            <span className="trending-topic">{item.topic}</span>
            <span className="trending-meta">{item.posts} posts</span>
          </div>
        ))}
        <button className="show-more">Show more</button>
      </div>

      <div className="sidebar-section suggestions-section">
        <h3>Who to follow</h3>
        {suggestions.map((user, i) => (
          <div key={i} className="suggestion-item">
            <div className="user-avatar">{user.avatar}</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-handle">{user.handle}</span>
            </div>
            <button className="follow-btn">Follow</button>
          </div>
        ))}
        <button className="show-more">Show more</button>
      </div>
      
      <div className="sidebar-footer">
        Terms of Service Privacy Policy Cookie Policy Accessibility Ads info © 2026 Ziele, Inc.
      </div>
    </aside>
  );
}

export default Sidebar;
