import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./DraftsPage.css";

/* ── Mock drafts ──────────────────────────────────────────────── */

const initialDrafts = [
  {
    id: "draft-1",
    title: "How I Built My First Open Source Project",
    content: "Starting an open source project felt intimidating at first. There were so many considerations — licensing, documentation, community guidelines. But once I broke it down into manageable steps, the whole process became surprisingly approachable...",
    tags: ["Open Source", "Developer", "Journey"],
    lastEdited: "2026-01-14T12:30:00.000Z",
    wordCount: 1240,
    status: "in-progress",
  },
  {
    id: "draft-2",
    title: "A Deep Dive into React Server Components",
    content: "React Server Components represent a fundamental shift in how we think about rendering. By moving computation to the server, we can reduce bundle sizes significantly while maintaining the interactive richness users expect...",
    tags: ["React", "Performance", "Web Dev"],
    lastEdited: "2026-01-13T08:15:00.000Z",
    wordCount: 2850,
    status: "in-progress",
  },
  {
    id: "draft-3",
    title: "The Psychology of Color in Digital Design",
    content: "Color isn't just aesthetic — it's psychological. Every hue triggers an emotional response, and understanding these associations is crucial for creating interfaces that resonate with users on a deeper level...",
    tags: ["Design", "Psychology", "UI/UX"],
    lastEdited: "2026-01-12T19:45:00.000Z",
    wordCount: 780,
    status: "outline",
  },
  {
    id: "draft-4",
    title: "",
    content: "Just jotting down some quick notes about a new idea for a blog post about TypeScript generics and when they actually help vs when they add unnecessary complexity...",
    tags: [],
    lastEdited: "2026-01-11T10:00:00.000Z",
    wordCount: 195,
    status: "idea",
  },
];

const statusConfig = {
  "in-progress": { label: "In Progress", color: "var(--info)", bg: "color-mix(in srgb, var(--info) 12%, transparent)" },
  outline: { label: "Outline", color: "var(--warning)", bg: "color-mix(in srgb, var(--warning) 12%, transparent)" },
  idea: { label: "Idea", color: "var(--text-muted)", bg: "var(--bg-elevated)" },
};

function DraftsPage() {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredDrafts = filterStatus === "all"
    ? drafts
    : drafts.filter((d) => d.status === filterStatus);

  const removeDraft = (id) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const formatEditDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const totalWords = drafts.reduce((sum, d) => sum + d.wordCount, 0);

  return (
    <div className="page drafts-page">
      {/* ── Header ── */}
      <div className="drafts-header">
        <div>
          <h1>
            <span className="drafts-header-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </span>
            Drafts
          </h1>
          <p className="drafts-subtitle">
            {drafts.length} {drafts.length === 1 ? "draft" : "drafts"} · {totalWords.toLocaleString()} words total
          </p>
        </div>
        <Link to="/create" className="drafts-new-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Draft
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="drafts-stats-row">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const count = drafts.filter((d) => d.status === key).length;
          return (
            <button
              key={key}
              type="button"
              className={`drafts-stat-chip${filterStatus === key ? " active" : ""}`}
              onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
              style={{ "--chip-color": cfg.color, "--chip-bg": cfg.bg }}
            >
              <span className="drafts-stat-dot" />
              <span className="drafts-stat-label">{cfg.label}</span>
              <span className="drafts-stat-count">{count}</span>
            </button>
          );
        })}
        {filterStatus !== "all" && (
          <button
            type="button"
            className="drafts-clear-filter"
            onClick={() => setFilterStatus("all")}
          >
            Clear filter
          </button>
        )}
      </div>

      {/* ── Draft list ── */}
      {filteredDrafts.length === 0 ? (
        <div className="drafts-empty">
          <div className="drafts-empty-icon">📝</div>
          <h3>No drafts yet</h3>
          <p>Your unfinished thoughts and stories will live here.</p>
          <Link to="/create" className="drafts-empty-btn">Start writing</Link>
        </div>
      ) : (
        <div className="drafts-list">
          {filteredDrafts.map((draft, index) => {
            const cfg = statusConfig[draft.status];
            return (
              <article
                key={draft.id}
                className="draft-card"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="draft-card-top">
                  <span
                    className="draft-status-badge"
                    style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  <div className="draft-card-actions">
                    <span className="draft-card-edited">
                      Edited {formatEditDate(draft.lastEdited)}
                    </span>
                    <button
                      type="button"
                      className="draft-delete-btn"
                      onClick={() => removeDraft(draft.id)}
                      title="Delete draft"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>

                <Link to="/create" className="draft-card-body">
                  <h3 className="draft-card-title">
                    {draft.title || "Untitled Draft"}
                  </h3>
                  <p className="draft-card-content">{draft.content}</p>
                </Link>

                <div className="draft-card-footer">
                  <div className="draft-card-tags">
                    {draft.tags.length > 0
                      ? draft.tags.map((tag) => (
                          <span key={tag} className="draft-tag">{tag}</span>
                        ))
                      : <span className="draft-no-tags">No tags</span>}
                  </div>
                  <div className="draft-card-meta">
                    <span className="draft-word-count">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {draft.wordCount.toLocaleString()} words
                    </span>
                    <Link to="/create" className="draft-edit-btn">
                      Continue editing →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DraftsPage;
