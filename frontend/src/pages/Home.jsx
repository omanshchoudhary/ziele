import React from 'react';
import '../components/PostCard.css';

function Home() {
  const posts = [
    {
      id: 1,
      avatar: "OC",
      authorName: "Omansh Choudhary",
      authorHandle: "@omansh",
      time: "2h ago",
      title: "The Future of Web Dev",
      content: "As we move further into the decade, the landscape of the web continues to evolve at a breakneck pace. This is a deep dive into what the future holds.",
      tags: ["Technology", "React", "Design"],
      likes: "1.2k"
    },
    {
      id: 2,
      avatar: "ZO",
      authorName: "Ziele Official",
      authorHandle: "@zieleapp",
      time: "5h ago",
      title: "Ziele: Next-Gen Social Blogging",
      content: "We're excited to launch Ziele, a platform designed for writers by writers. Our mission is to provide a clean space to share your thoughts.",
      tags: ["Platform", "Updates", "News"],
      likes: "4.5k"
    },
    {
      id: 3,
      avatar: "JS",
      authorName: "Jane Smith",
      authorHandle: "@janesmith",
      time: "1d ago",
      title: "Minimalist UI is Here to Stay",
      content: "In an era of information overload, simplicity is the ultimate sophistication. Designers are returning to the basics with minimalist interfaces.",
      tags: ["Design", "UI/UX", "Trends"],
      likes: "892"
    }
  ];

  return (
    <div className="feed">
      {posts.map((post) => (
        <article key={post.id} className="post-card">
          <div className="post-header-top">
            <div className="post-author-avatar">{post.avatar}</div>
            <div className="post-author-info">
              <span className="post-author-name">{post.authorName}</span>
              <span className="post-author-handle">{post.authorHandle}</span>
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
  );
}

export default Home;
