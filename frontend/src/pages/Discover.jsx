import React, { useState } from 'react';
import './Discover.css';

function Discover() {
  const [selectedCategories, setSelectedCategories] = useState([]);

  const categories = [
    'Recommended',
    'Writing',
    'UX',
    'Community',
    'Copywriting',
    'Productivity',
    'Strategy',
  ];

  const blogs = [
    {
      id: 1,
      title: 'Writing for a Modern Audience',
      summary: 'Build content that connects, converts, and keeps readers coming back with a clean writer-first experience.',
      author: 'Aurora Lane',
      category: 'Writing',
      views: '8.3k',
      readTime: '6 min read',
    },
    {
      id: 2,
      title: 'Designing Dark Mode Experiences',
      summary: 'Learn how subtle contrast, soft glow, and refined spacing create a premium dark interface.',
      author: 'Riley Frost',
      category: 'UX',
      views: '5.4k',
      readTime: '5 min read',
    },
    {
      id: 3,
      title: 'How to Launch a Community Blog',
      summary: 'A practical guide to turning your platform into an engaging place for creators, readers, and conversations.',
      author: 'Mira Patel',
      category: 'Community',
      views: '6.1k',
      readTime: '7 min read',
    },
    {
      id: 4,
      title: 'Microcopy That Feels Human',
      summary: 'Tiny words can have a big impact. Write interface text that feels warm, clear, and unmistakably yours.',
      author: 'Noah Kim',
      category: 'Copywriting',
      views: '3.9k',
      readTime: '4 min read',
    },
    {
      id: 5,
      title: 'Turning Notes into Stories',
      summary: 'Transform scattered ideas into polished narratives with a workflow that keeps momentum and clarity.',
      author: 'Sofia Reed',
      category: 'Productivity',
      views: '4.8k',
      readTime: '5 min read',
    },
    {
      id: 6,
      title: 'Publishing with Purpose',
      summary: 'Create content that amplifies your voice while staying aligned with your values and long-term goals.',
      author: 'Elijah Stone',
      category: 'Strategy',
      views: '7.2k',
      readTime: '8 min read',
    },
  ];

  const suggestedProfiles = [
    {
      id: 1,
      initials: 'AC',
      name: 'Ava Chen',
      handle: '@avachen',
      note: 'Creative director sharing design systems and writing tips.',
      followers: '14.2k',
      posts: '128',
    },
    {
      id: 2,
      initials: 'LK',
      name: 'Luca King',
      handle: '@lucaking',
      note: 'Storytelling strategist with daily content prompts.',
      followers: '9.8k',
      posts: '94',
    },
    {
      id: 3,
      initials: 'JM',
      name: 'Jade Morgan',
      handle: '@jadem',
      note: 'Author focused on minimal UX and creator growth.',
      followers: '12.3k',
      posts: '112',
    },
    {
      id: 4,
      initials: 'TN',
      name: 'Toni Nguyen',
      handle: '@toniny',
      note: 'Growth writer sharing creator playbooks and daily habits.',
      followers: '11.6k',
      posts: '104',
    },
  ];

  const visibleBlogs =
    selectedCategories.length === 0
      ? blogs
      : blogs.filter((blog) => selectedCategories.includes(blog.category));

  const feedElements = [];

  visibleBlogs.forEach((blog, index) => {
    feedElements.push(
      <article key={blog.id} className="discover-card">
        <div className="discover-card-meta">
          <span>{blog.category}</span>
          <span>{blog.views} views</span>
        </div>
        <h2 className="discover-card-title">{blog.title}</h2>
        <p className="discover-card-summary">{blog.summary}</p>
        <div className="discover-card-meta discover-card-footer">
          <span>{blog.author} · {blog.readTime}</span>
          <button className="read-now-btn" type="button">Read now →</button>
        </div>
        <div className="card-tags">
          <span className="card-tag">#Discover</span>
          <span className="card-tag">#{blog.category.toLowerCase()}</span>
        </div>
      </article>
    );

    if (index === 3) {
      feedElements.push(
        <section key="follow-suggestion" className="suggestion-panel">
          <div className="suggestions-header">
            <div>
              <h2>Keep up with creators</h2>
              <p className="suggestion-subtitle">Explore creator cards designed for inspiration and discovery.</p>
            </div>
            <span>View all</span>
          </div>

          <div className="creator-grid">
            {suggestedProfiles.map((profile) => (
              <article key={profile.id} className="creator-card">
                <div className="creator-top-block">
                  <div className="creator-top-avatar">{profile.initials}</div>
                </div>
                <div className="creator-card-body">
                  <div className="creator-name-row">
                    <p className="creator-name">{profile.name}</p>
                    <p className="creator-username">{profile.handle}</p>
                  </div>
                  <p className="creator-bio">{profile.note}</p>
                </div>
                <div className="creator-card-footer">
                  <div className="creator-card-stats">
                    <span className="creator-stat">
                      <span className="creator-stat-icon followers" />{profile.followers || '9.8k'}
                    </span>
                    <span className="creator-stat">
                      <span className="creator-stat-icon posts" />{profile.posts || '98'}
                    </span>
                  </div>
                  <button className="creator-follow-btn" type="button">Follow</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }
  });

  return (
    <div className="page discover-page">
      <div className="discover-intro">
        <h1>Discover</h1>
        <p>Browse trending stories, learn from top creators, and see suggested profiles as you explore new content.</p>
      </div>

      <nav className="discover-nav">
        {categories.map((category) => {
          const isActive =
            category === 'Recommended'
              ? selectedCategories.length === 0
              : selectedCategories.includes(category);

          return (
            <button
              key={category}
              type="button"
              className={`discover-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (category === 'Recommended') {
                  setSelectedCategories([]);
                  return;
                }

                setSelectedCategories((current) => {
                  if (current.includes(category)) {
                    const next = current.filter((item) => item !== category);
                    return next;
                  }
                  return [...current, category];
                });
              }}
            >
              {category}
            </button>
          );
        })}
      </nav>

      <div className="discover-layout">
        <section className="discover-list">{feedElements}</section>
      </div>
    </div>
  );
}

export default Discover;
