import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  mockTrendingTopics,
  mockPosts,
  mockDiscoverBlogs,
  formatCompactNumber,
} from "../data/mockData";
import "../components/PostCard.css";
import "./TrendingPage.css";

/* ── Extended trending data ───────────────────────────────────── */

const trendingCategories = ["All", "Technology", "Design", "Writing", "Business", "Product"];

const trendingAuthors = [
  { id: "omansh", name: "Omansh Choudhary", handle: "@omansh", avatar: "OC", posts: 45, trend: "+12%" },
  { id: "arivera", name: "Alex Rivera", handle: "@arivera", avatar: "AR", posts: 27, trend: "+8%" },
  { id: "janesmith", name: "Jane Smith", handle: "@janesmith", avatar: "JS", posts: 32, trend: "+15%" },
];

function TrendingPage() {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const tagQuery = (searchParams.get("tag") || "").toLowerCase();

  // Merge posts and discover blogs into a single trending list
  const trendingPosts = useMemo(() => {
    const allPosts = [
      ...mockPosts.map((p) => ({
        id: p.id,
        title: p.title,
        summary: p.content,
        author: p.authorName,
        avatar: p.avatar,
        category: p.tags?.[0] || "General",
        tags: p.tags || [],
        likes: p.likes,
        views: p.views,
        comments: p.comments,
        readTime: p.readTime,
        time: p.time,
        trendScore: (p.likes || 0) + (p.comments || 0) * 3 + (p.views || 0) * 0.1,
      })),
      ...mockDiscoverBlogs.map((b) => ({
        id: `disc-${b.id}`,
        title: b.title,
        summary: b.summary,
        author: b.author,
        avatar: b.author?.slice(0, 2).toUpperCase() || "??",
        category: b.category,
        tags: [b.category],
        likes: Math.floor(Math.random() * 2000) + 200,
        views: b.views,
        comments: Math.floor(Math.random() * 100) + 10,
        readTime: b.readTime,
        time: "Recent",
        trendScore: Math.floor(Math.random() * 5000) + 1000,
      })),
    ];

    let filtered = allPosts;
    if (activeCategory !== "All") {
      filtered = filtered.filter(
        (p) => p.category === activeCategory || p.tags.includes(activeCategory),
      );
    }
    if (tagQuery) {
      filtered = filtered.filter(
        (p) =>
          p.category.toLowerCase().includes(tagQuery) ||
          p.tags.some((t) => t.toLowerCase().includes(tagQuery)),
      );
    }

    return filtered.sort((a, b) => b.trendScore - a.trendScore);
  }, [activeCategory, tagQuery]);

  return (
    <div className="page trending-page">
      <div className="trending-hero">
        <h1>
          <span className="trending-hero-icon">🔥</span>
          Trending Now
        </h1>
        <p>
          See what&apos;s capturing attention right now. Posts ranked by engagement velocity, views, and community buzz.
        </p>
      </div>

      {/* ── Topic Pills ── */}
      <div className="trending-topics-bar">
        <h2 className="trending-topics-title">Hot Topics</h2>
        <div className="trending-topics-grid">
          {mockTrendingTopics.map((topic) => (
            <Link
              key={topic.tag}
              to={`/discover?tag=${encodeURIComponent(topic.tag.replace("#", ""))}`}
              className="trending-topic-chip"
            >
              <span className="trending-topic-tag">{topic.tag}</span>
              <span className="trending-topic-name">{topic.topic}</span>
              <span className="trending-topic-count">
                {formatCompactNumber(topic.posts)} posts
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Category filter ── */}
      <nav className="trending-category-nav" aria-label="Trending categories">
        {trendingCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`trending-cat-btn${activeCategory === cat ? " active" : ""}`}
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* ── Trending posts ── */}
      <section className="trending-posts-list">
        {trendingPosts.length === 0 ? (
          <div className="trending-empty">
            <p>No trending posts in this category yet.</p>
            <button type="button" className="trending-reset-btn" onClick={() => setActiveCategory("All")}>
              View all trending
            </button>
          </div>
        ) : (
          trendingPosts.map((post, index) => (
            <Link
              key={post.id}
              to={`/post/${typeof post.id === "number" ? post.id : 1}`}
              className="trending-post-card"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <span className="trending-rank">#{index + 1}</span>
              <div className="trending-post-avatar">{post.avatar}</div>
              <div className="trending-post-body">
                <h3 className="trending-post-title">{post.title}</h3>
                <p className="trending-post-summary">{post.summary}</p>
                <div className="trending-post-meta">
                  <span>{post.author}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                  <span>·</span>
                  <span>❤️ {formatCompactNumber(post.likes)}</span>
                  <span>·</span>
                  <span>💬 {formatCompactNumber(post.comments)}</span>
                </div>
              </div>
              <span className="trending-post-category">{post.category}</span>
            </Link>
          ))
        )}
      </section>

      {/* ── Trending Authors ── */}
      <section className="trending-authors">
        <h2>Trending Authors</h2>
        <div className="trending-authors-grid">
          {trendingAuthors.map((author) => (
            <Link
              key={author.id}
              to={`/profile/${author.id}`}
              className="trending-author-card"
            >
              <div className="trending-author-avatar">{author.avatar}</div>
              <div className="trending-author-info">
                <span className="trending-author-name">{author.name}</span>
                <span className="trending-author-handle">{author.handle}</span>
              </div>
              <div className="trending-author-stats">
                <span className="trending-author-posts">{author.posts} posts</span>
                <span className="trending-author-trend">{author.trend}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default TrendingPage;
