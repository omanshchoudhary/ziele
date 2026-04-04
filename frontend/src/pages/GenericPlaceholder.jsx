import React from 'react';
import { useLocation, Link } from 'react-router-dom';

function GenericPlaceholder() {
  const location = useLocation();
  const pageName = location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2);

  return (
    <div className="placeholder-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(10px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      margin: '2rem',
      color: '#fff'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.8 }}>✨</div>
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: '800', 
        marginBottom: '1rem',
        background: 'linear-gradient(45deg, #fff, #ff5c9d)', 
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {pageName}
      </h1>
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.6)', 
        fontSize: '1.1rem', 
        maxWidth: '500px', 
        textAlign: 'center',
        lineHeight: '1.6'
      }}>
        We're currently building the <strong>{pageName}</strong> experience. 
        Stay tuned for a revolutionary way to interact with content on Ziele.
      </p>
      <Link to="/" style={{
        marginTop: '2rem',
        padding: '0.8rem 2rem',
        background: '#ff5c9d',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '99px',
        fontWeight: '600',
        transition: 'all 0.3s ease'
      }}>
        Back to Home
      </Link>
    </div>
  );
}

export default GenericPlaceholder;
