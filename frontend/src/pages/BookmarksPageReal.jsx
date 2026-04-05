import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBookmarkedPosts, toggleBookmark } from "../lib/apiClient";
import { formatCompactNumber } from "../lib/formatters";
import "../components/PostCard.css";
import "./BookmarksPage.css";

const sortOptions = [
  { value: "recent", label: "Recently saved" },
  { value: "oldest", label: "Oldest first" },
  { value: "popular", label: "Most popular" },
];

function BookmarksPageReal() {
  const [sortBy, setSortBy] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    getBookmarkedPosts()
      .then((items) => {
        if (!cancelled) {
          setBookmarks(Array.isArray(items) ? items : []);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError.message || "Unable to load bookmarks.");
          setBookmarks([]);
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
  }, []);

  const filteredBookmarks = useMemo(() => {
    let items = [...bookmarks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((post) => {
        const title = (post.title || "").toLowerCase();
        const summary = (post.summary || post.contentText || post.content || "").toLowerCase();
        const author = (post.authorName || "").toLowerCase();
        const tags = (post.tags || []).map((tag) => String(tag).toLowerCase());

        return (
          title.includes(q) ||
          summary.includes(q) ||
          author.includes(q) ||
          tags.some((tag) => tag.includes(q))
        );
      });
    }

    if (sortBy === "recent") {
      items.sort((a, b) => new Date(b.savedAt || b.updatedAt || 0) - new Date(a.savedAt || a.updatedAt || 0));
    } else if (sortBy === "oldest") {
      items.sort((a, b) => new Date(a.savedAt || a.updatedAt || 0) - new Date(b.savedAt || b.updatedAt || 0));
    } else if (sortBy === "popular") {
      items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return items;
  }, [bookmarks, searchQuery, sortBy]);

  const removeBookmark = (id) => {
    toggleBookmark(id)
      .then((response) => {
        if (response?.bookmarked === false) {
          setBookmarks((current) => current.filter((post) => post.id !== id));
        }
      })
      .catch((bookmarkError) => {
        window.alert(bookmarkError.message || "Unable to remove bookmark.");
      });
  };

  const formatSavedDate = (dateStr) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Recently";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="page bookmarks-page">
        <div className="bookmarks-header">
          <h1>Bookmarks</h1>
          <p className="bookmarks-subtitle">Loading your saved stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page bookmarks-page">
      <div className="bookmarks-header">
        <div>
          <h1>Bookmarks</h1>
          <p className="bookmarks-subtitle">
            {filteredBookmarks.length} saved {filteredBookmarks.length === 1 ? "story" : "stories"}
          </p>
          {error ? <p className="bookmarks-subtitle">{error}</p> : null}
        </div>
      </div>

      <div className="bookmarks-controls">
        <div className="bookmarks-search-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="bookmarks-search"
          />
        </div>
        <div className="bookmarks-sort">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`bookmarks-sort-btn${sortBy === option.value ? " active" : ""}`}
              onClick={() => setSortBy(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredBookmarks.length === 0 ? (
        <div className="bookmarks-empty">
          <h3>No bookmarks yet</h3>
          <p>Save stories from Home or Post pages and they will appear here.</p>
          <Link to="/" className="bookmarks-browse-btn">Browse stories</Link>
        </div>
      ) : (
        <div className="bookmarks-list">
          {filteredBookmarks.map((post, index) => (
            <article
              key={post.id}
              className="bookmark-card"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className="bookmark-card-top">
                <div className="bookmark-card-author">
                  <div className="bookmark-card-avatar">{post.avatar}</div>
                  <div>
                    <span className="bookmark-card-name">{post.authorName}</span>
                    <span className="bookmark-card-handle">{post.authorHandle}</span>
                  </div>
                </div>
                <div className="bookmark-card-actions">
                  <span className="bookmark-card-saved">Saved {formatSavedDate(post.savedAt)}</span>
                  <button
                    type="button"
                    className="bookmark-remove-btn"
                    onClick={() => removeBookmark(post.id)}
                    title="Remove bookmark"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              <Link to={post.sharePath || `/post/${post.id}`} className="bookmark-card-body">
                <h3 className="bookmark-card-title">{post.title}</h3>
                <p className="bookmark-card-content">{post.summary || post.contentText}</p>
              </Link>

              <div className="bookmark-card-footer">
                <div className="bookmark-card-tags">
                  {post.tags?.map((tag) => (
                    <span key={tag} className="bookmark-tag">{tag}</span>
                  ))}
                </div>
                <div className="bookmark-card-stats">
                  <span>Likes {formatCompactNumber(post.likes || 0)}</span>
                  <span>Comments {formatCompactNumber(post.comments || 0)}</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookmarksPageReal;

