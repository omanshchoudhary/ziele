import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getTrendingData } from "../lib/apiClient";
import { formatCompactNumber } from "../lib/formatters";
import "../components/PostCard.css";
import "./TrendingPage.css";

function normalizeTag(value = "") {
  return String(value).replace(/^#/, "").trim().toLowerCase();
}

function TrendingPageReal() {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const [trending, setTrending] = useState({ topics: [], posts: [], authors: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const queryTag = normalizeTag(searchParams.get("tag") || "");
  const querySearch = String(searchParams.get("q") || "").trim();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    getTrendingData({
      tag: queryTag || undefined,
      q: querySearch || undefined,
      limit: 30,
    })
      .then((data) => {
        if (!cancelled) {
          setTrending({
            topics: Array.isArray(data?.topics) ? data.topics : [],
            posts: Array.isArray(data?.posts) ? data.posts : [],
            authors: Array.isArray(data?.authors) ? data.authors : [],
          });
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError.message || "Unable to load trending content.");
          setTrending({ topics: [], posts: [], authors: [] });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [querySearch, queryTag]);

  const categories = useMemo(() => {
    const tagSet = new Set(["All"]);
    trending.posts.forEach((post) => {
      (post.tags || []).forEach((tag) => {
        const clean = String(tag || "").trim();
        if (clean) tagSet.add(clean);
      });
      if (post.category) tagSet.add(post.category);
    });
    return [...tagSet].slice(0, 8);
  }, [trending.posts]);

  const visiblePosts = useMemo(() => {
    if (activeCategory === "All") {
      return trending.posts;
    }

    const normalizedActive = normalizeTag(activeCategory);
    return trending.posts.filter((post) => {
      const category = normalizeTag(post.category || "");
      const tags = (post.tags || []).map((tag) => normalizeTag(tag));
      return category === normalizedActive || tags.includes(normalizedActive);
    });
  }, [activeCategory, trending.posts]);

  if (isLoading) {
    return (
      <div className="page trending-page">
        <div className="trending-hero">
          <h1>Trending Now</h1>
          <p>Loading the latest momentum across the platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page trending-page">
      <div className="trending-hero">
        <h1>Trending Now</h1>
        <p>
          Live ranking by recency and engagement, so you can discover what is rising right now.
        </p>
        {error ? <p>{error}</p> : null}
      </div>

      <div className="trending-topics-bar">
        <h2 className="trending-topics-title">Hot Topics</h2>
        <div className="trending-topics-grid">
          {trending.topics.map((topic) => (
            <Link
              key={topic.tag}
              to={`/discover?tag=${encodeURIComponent(normalizeTag(topic.tag || topic.topic))}`}
              className="trending-topic-chip"
            >
              <span className="trending-topic-tag">{topic.tag || `#${topic.topic}`}</span>
              <span className="trending-topic-name">{topic.topic}</span>
              <span className="trending-topic-count">
                score {formatCompactNumber(Math.round(topic.score || 0))}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <nav className="trending-category-nav" aria-label="Trending categories">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`trending-cat-btn${activeCategory === category ? " active" : ""}`}
            onClick={() => setActiveCategory(category)}
            aria-pressed={activeCategory === category}
          >
            {category}
          </button>
        ))}
      </nav>

      <section className="trending-posts-list">
        {visiblePosts.length === 0 ? (
          <div className="trending-empty">
            <p>No trending posts for this category yet.</p>
            <button type="button" className="trending-reset-btn" onClick={() => setActiveCategory("All")}>
              View all trending
            </button>
          </div>
        ) : (
          visiblePosts.map((post, index) => (
            <Link
              key={post.id}
              to={post.sharePath || `/post/${post.id}`}
              className="trending-post-card"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <span className="trending-rank">#{post.trendRank || index + 1}</span>
              <div className="trending-post-avatar">{post.avatar}</div>
              <div className="trending-post-body">
                <h3 className="trending-post-title">{post.title}</h3>
                <p className="trending-post-summary">{post.summary || post.contentText}</p>
                <div className="trending-post-meta">
                  <span>{post.authorName}</span>
                  <span> - </span>
                  <span>{post.readTime}</span>
                  <span> - </span>
                  <span>Likes {formatCompactNumber(post.likes || 0)}</span>
                  <span> - </span>
                  <span>Comments {formatCompactNumber(post.comments || 0)}</span>
                </div>
              </div>
              <span className="trending-post-category">{post.category || post.tags?.[0] || "General"}</span>
            </Link>
          ))
        )}
      </section>

      <section className="trending-authors">
        <h2>Trending Authors</h2>
        <div className="trending-authors-grid">
          {trending.authors.map((author) => (
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
                <span className="trending-author-trend">
                  score {formatCompactNumber(Math.round(author.score || 0))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default TrendingPageReal;

