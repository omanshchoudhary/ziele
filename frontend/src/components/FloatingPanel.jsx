import React, { useState } from 'react';
import './FloatingPanel.css';

function FloatingPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`floating-panel ${isOpen ? 'expanded' : 'collapsed'}`}>
      <button 
        className="floating-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Collapse Menu" : "Expand Menu"}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        )}
      </button>

      <div className="floating-content">
        <h3 className="floating-header">Menu</h3>
        <ul className="floating-menu">
          <li>Analytics</li>
          <li>Drafts</li>
          <li>Bookmarks</li>
          <li>Settings</li>
        </ul>
      </div>
    </div>
  );
}

export default FloatingPanel;
