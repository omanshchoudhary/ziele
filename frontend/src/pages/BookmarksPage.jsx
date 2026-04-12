import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { mockPosts, formatCompactNumber } from "../data/mockData";
import "../components/PostCard.css";
import "./BookmarksPage.css";

/* ── Mock bookmarked posts (subset of mockPosts + extras) ──── */

const bookmarkedPostIds = [2, 4, 5, 1]; // IDs from mockPosts
const bookmarkDates = {
  2: "2026-01-14T09:00:00.000Z",
  4: "2026-01-13T14:00:00.000Z",
  5: "2026-01-12T08:00:00.000Z",
  1: "2026-01-11T18:00:00.000Z",
};

const sortOptions = [
  { value: "recent", label: "Recently saved" },
  { value: "oldest", label: "Oldest first" },
  { value: "popular", label: "Most popular" },
];

function BookmarksPage() {
  const [sortBy, setSortBy] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [removedIds, setRemovedIds] = useState(new Set());

  const bookmarks = useMemo(() => {
    let items = bookmarkedPostIds
      .filter((id) => !removedIds.has(id))
      .map((id) => {
        const post = mockPosts.find((p) => p.id === id);
        if (!post) return null;
        return {
          ...post,
          savedAt: bookmarkDates[id] || new Date().toISOString(),
        };
      })
      .filter(Boolean);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Sort
    if (sortBy === "recent") {
      items.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    } else if (sortBy === "oldest") {
      items.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt));
    } else if (sortBy === "popular") {
      items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return items;
  }, [sortBy, searchQuery, removedIds]);

  const removeBookmark = (id) => {
    setRemovedIds((prev) => new Set([...prev, id]));
  };

  const formatSavedDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="page bookmarks-page">
      <div className="bookmarks-header">
        <div>
          <h1>
            <span className="bookmarks-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            </span>
            Bookmarks
          </h1>
          <p className="bookmarks-subtitle">
            {bookmarks.length} saved {bookmarks.length === 1 ? "story" : "stories"}
          </p>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="bookmarks-controls">
        <div className="bookmarks-search-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bookmarks-search"
          />
        </div>
        <div className="bookmarks-sort">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`bookmarks-sort-btn${sortBy === opt.value ? " active" : ""}`}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bookmark list ── */}
      {bookmarks.length === 0 ? (
        <div className="bookmarks-empty">
          <div className="bookmarks-empty-icon">🔖</div>
          <h3>No bookmarks yet</h3>
          <p>Stories you save will appear here for easy access.</p>
          <Link to="/feed" className="bookmarks-browse-btn">Browse stories</Link>
        </div>
      ) : (
        <div className="bookmarks-list">
          {bookmarks.map((post, index) => (
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

              <Link to={`/post/${post.id}`} className="bookmark-card-body">
                <h3 className="bookmark-card-title">{post.title}</h3>
                <p className="bookmark-card-content">{post.content}</p>
              </Link>

              <div className="bookmark-card-footer">
                <div className="bookmark-card-tags">
                  {post.tags?.map((tag) => (
                    <span key={tag} className="bookmark-tag">{tag}</span>
                  ))}
                </div>
                <div className="bookmark-card-stats">
                  <span>❤️ {formatCompactNumber(post.likes)}</span>
                  <span>💬 {formatCompactNumber(post.comments)}</span>
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

export default BookmarksPage;
