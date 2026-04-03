import React from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/profile.css';
import '../components/PostCard.css';

function Profile() {
  const { id } = useParams();
  
  const mockUser = {
    name: 'Omansh Choudhary',
    handle: '@omansh',
    bio: 'Founding Ziele. Architecting the future of social blogging with a focus on minimalism and speed. 🖋️✨',
    avatar: 'OC',
    followers: '12.4k',
    following: '892',
    posts: '45',
    likes: '38k',
    streak: 12,
    isPremium: true,
    joined: 'January 2024'
  };

  const mockPosts = [
    { 
      id: 1, 
      title: 'The Future of AI in Creative Writing', 
      content: 'Exploring how artificial intelligence is transforming the landscape of storytelling and content creation in 2024. From automated drafting to creative assistance...', 
      likes: '1.2k', 
      time: '2h ago', 
      tags: ['AI', 'Writing', 'Tech'] 
    },
    { 
      id: 2, 
      title: 'Design Systems That Scale', 
      content: 'Building robust design systems that grow with your product and team. Lessons learned from scaling multi-brand platforms with consistency...', 
      likes: '892', 
      time: '1d ago', 
      tags: ['Design', 'UX'] 
    },
    { 
      id: 3, 
      title: 'Mastering React Performance', 
      content: 'Deep dive into useMemo, useCallback, and virtualization techniques to ensure your React applications stay buttery smooth at any scale...', 
      likes: '2.5k', 
      time: '3d ago', 
      tags: ['React', 'WebDev'] 
    },
    { 
      id: 4, 
      title: 'The Minimalist Manifesto', 
      content: 'Why removing features is often more valuable than adding them. A philosophical approach to modern product design and development...', 
      likes: '1.1k', 
      time: '1w ago', 
      tags: ['Design', 'Mindset'] 
    },
    { 
      id: 5, 
      title: 'Ziele v2: The Roadmap', 
      content: 'A sneak peek into the upcoming features of Ziele, including real-time collaboration, global search, and integrated analytics...', 
      likes: '5.6k', 
      time: '2w ago', 
      tags: ['Product', 'Update'] 
    }
  ];

  return (
    <div className="profile-container">
      {/* Floating Glass Header */}
      <div className="profile-glass-card">
        <div className="profile-header-main">
          <div className="profile-avatar-elite">
            {mockUser.avatar}
            <div className="profile-status-dot"></div>
          </div>
          
          <div className="profile-identity">
            <h1 className="profile-name-elite">
              {mockUser.name}
              {mockUser.isPremium && <span className="premium-check" title="Verified Author">✓</span>}
            </h1>
            <p className="profile-handle-elite">{mockUser.handle}</p>
          </div>

          <div className="profile-cta-group">
            <button className="nav-btn-primary">Edit Profile</button>
            <button className="action-icon-btn profile-share-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>
        </div>

        <p className="profile-bio-elite">{mockUser.bio}</p>
        
        <div className="profile-stats-elite">
          <div className="elite-stat">
            <span className="stat-value">{mockUser.posts}</span>
            <span className="stat-label">Stories</span>
          </div>
          <div className="elite-stat">
            <span className="stat-value">{mockUser.followers}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="elite-stat">
            <span className="stat-value">{mockUser.following}</span>
            <span className="stat-label">Following</span>
          </div>
          <div className="elite-stat">
            <span className="stat-value">{mockUser.likes}</span>
            <span className="stat-label">Likes</span>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="profile-nav-tabs">
        <button className="profile-tab active">Stories</button>
        <button className="profile-tab">Drafts</button>
        <button className="profile-tab">Bookmarks</button>
        <button className="profile-tab">About</button>
      </div>

      {/* User Content Feed */}
      <div className="profile-feed">
        {mockPosts.map(post => (
          <article key={post.id} className="post-card">
            <div className="post-header-top">
              <div className="post-author-avatar">{mockUser.avatar}</div>
              <div className="post-author-info">
                <span className="post-author-name">{mockUser.name}</span>
                <span className="post-author-handle">{mockUser.handle}</span>
              </div>
              <span className="post-time">{post.time}</span>
            </div>
            
            <div className="post-body-mid">
              <h2 className="post-title">{post.title}</h2>
              <p className="post-content">{post.content}</p>
              <div className="post-tags-container">
                {post.tags.map(tag => (
                  <span key={tag} className="post-tag-pill">{tag}</span>
                ))}
              </div>
            </div>
            
            <div className="post-actions-bottom">
              <button className="action-icon-btn like-btn" title="Like">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                <span>{post.likes}</span>
              </button>
              <button className="action-icon-btn dislike-btn" title="Dislike">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 10-2 2-2-2"></path><circle cx="12" cy="12" r="10"></circle><path d="m10 14 2-2 2 2"></path></svg>
              </button>
              <button className="action-icon-btn share-btn" title="Share">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
              <button className="action-icon-btn bookmark-btn" title="Bookmark">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Profile;