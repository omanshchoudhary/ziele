import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPosts, reactToPost, toggleBookmark } from "../lib/apiClient";
import FollowButton from "../components/FollowButton";
import { formatCompactNumber } from "../lib/formatters";
import "../components/PostCard.css";

function Home() {
  const [posts, setPosts] = useState([]);
  const [reactionState, setReactionState] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = (searchParams.get("q") || "").trim();

  useEffect(() => {
    let cancelled = false;

    getPosts()
      .then((data) => {
        if (cancelled) return;

        setPosts(data);
        setReactionState(
          data.reduce((acc, post) => {
            acc[post.id] = {
              liked: post.viewerReaction === "like",
              disliked: post.viewerReaction === "dislike",
              bookmarked: Boolean(post.isBookmarked),
              likes: post.likes || 0,
              dislikes: post.dislikes || 0,
              bookmarks: post.bookmarks || 0,
            };
            return acc;
          }, {}),
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load posts.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, [posts]);

  // Filter posts when a search query is active
  const filteredPosts = useMemo(() => {
    if (!searchQuery) return sortedPosts;

    const q = searchQuery.toLowerCase();
    return sortedPosts.filter((post) => {
      const title = (post.title || "").toLowerCase();
      const content = (post.summary || post.contentText || post.content || "").toLowerCase();
      const author = (post.authorName || "").toLowerCase();
      const handle = (post.authorHandle || "").toLowerCase();
      const tags = (post.tags || []).map((t) => t.toLowerCase());

      return (
        title.includes(q) ||
        content.includes(q) ||
        author.includes(q) ||
        handle.includes(q) ||
        tags.some((tag) => tag.includes(q))
      );
    });
  }, [sortedPosts, searchQuery]);

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next);
  };

  const getNextReactionSnapshot = (previous = {}, type) => {
    const next = {
      liked: Boolean(previous.liked),
      disliked: Boolean(previous.disliked),
      bookmarked: Boolean(previous.bookmarked),
      likes: previous.likes || 0,
      dislikes: previous.dislikes || 0,
      bookmarks: previous.bookmarks || 0,
    };

    if (type === "like") {
      if (next.liked) {
        next.liked = false;
        next.likes = Math.max(0, next.likes - 1);
      } else {
        next.liked = true;
        next.likes += 1;
        if (next.disliked) {
          next.disliked = false;
          next.dislikes = Math.max(0, next.dislikes - 1);
        }
      }
    }

    if (type === "dislike") {
      if (next.disliked) {
        next.disliked = false;
        next.dislikes = Math.max(0, next.dislikes - 1);
      } else {
        next.disliked = true;
        next.dislikes += 1;
        if (next.liked) {
          next.liked = false;
          next.likes = Math.max(0, next.likes - 1);
        }
      }
    }

    return next;
  };

  const syncReactionState = async (postId, type) => {
    const previousState = reactionState[postId] || {};
    const optimisticState = getNextReactionSnapshot(previousState, type);

    setReactionState((current) => ({
      ...current,
      [postId]: optimisticState,
    }));

    try {
      const response = await reactToPost(postId, type);
      if (!response?.post) return;

      setPosts((current) =>
        current.map((post) => (post.id === postId ? { ...post, ...response.post } : post)),
      );
      setReactionState((current) => ({
        ...current,
        [postId]: {
          ...(current[postId] || {}),
          liked: response.reaction === "like",
          disliked: response.reaction === "dislike",
          likes: response.post.likes || 0,
          dislikes: response.post.dislikes || 0,
          bookmarks: current[postId]?.bookmarks || response.post.bookmarks || 0,
          bookmarked: current[postId]?.bookmarked || false,
        },
      }));
    } catch (reactionError) {
      setReactionState((current) => ({
        ...current,
        [postId]: previousState,
      }));
      window.alert(reactionError.message || "Unable to save your reaction.");
    }
  };

  const onLike = (postId) => {
    syncReactionState(postId, "like");
  };

  const onDislike = (postId) => {
    syncReactionState(postId, "dislike");
  };

  const onBookmark = (postId) => {
    const previousState = reactionState[postId] || {};
    const optimisticState = {
      ...previousState,
      bookmarked: !previousState.bookmarked,
      bookmarks: previousState.bookmarked
        ? Math.max(0, (previousState.bookmarks || 0) - 1)
        : (previousState.bookmarks || 0) + 1,
    };

    setReactionState((current) => ({
      ...current,
      [postId]: optimisticState,
    }));

    toggleBookmark(postId)
      .then((response) => {
        if (!response?.post) return;

        setPosts((current) =>
          current.map((post) =>
            post.id === postId ? { ...post, ...response.post } : post,
          ),
        );
        setReactionState((current) => ({
          ...current,
          [postId]: {
            ...(current[postId] || {}),
            bookmarked: Boolean(response.bookmarked),
            bookmarks: response.post.bookmarks || 0,
            liked: response.post.viewerReaction === "like",
            disliked: response.post.viewerReaction === "dislike",
            likes: response.post.likes || current[postId]?.likes || 0,
            dislikes: response.post.dislikes || current[postId]?.dislikes || 0,
          },
        }));
      })
      .catch((bookmarkError) => {
        setReactionState((current) => ({
          ...current,
          [postId]: previousState,
        }));
        window.alert(bookmarkError.message || "Unable to save bookmark.");
      });
  };

  const onShare = async (postId, title) => {
    const post = posts.find((item) => item.id === postId);
    const sharePath = post?.sharePath || `/post/${postId}`;
    const shareUrl = `${window.location.origin}${sharePath}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out this post on Ziele: ${title}`,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert("Post link copied to clipboard!");
    } catch {
      window.alert(`Share this link: ${shareUrl}`);
    }
  };

  if (isLoading) {
    return <div className="feed">Loading stories...</div>;
  }

  if (error) {
    return <div className="feed">{error}</div>;
  }

  return (
    <div className="feed">
      {searchQuery && (
        <div className="feed-search-banner" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.25rem",
          marginBottom: "0.75rem",
          borderRadius: "var(--radius-lg, 14px)",
          background: "var(--bg-card-2, rgba(255,255,255,0.06))",
          border: "1px solid var(--glass-border, rgba(255,255,255,0.08))",
          fontSize: "0.9rem",
          color: "var(--text-soft, #aaa)",
        }}>
          <span>
            Showing <strong style={{ color: "var(--text-main, #fff)" }}>{filteredPosts.length}</strong>
            {filteredPosts.length === 1 ? " result" : " results"} for{" "}
            <strong style={{ color: "var(--accent-primary, #ff5c9d)" }}>"{searchQuery}"</strong>
          </span>
          <button
            type="button"
            onClick={clearSearch}
            style={{
              background: "none",
              border: "1px solid var(--glass-border, rgba(255,255,255,0.12))",
              color: "var(--text-soft, #aaa)",
              cursor: "pointer",
              padding: "0.3rem 0.75rem",
              borderRadius: "var(--radius-md, 8px)",
              fontSize: "0.82rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.target.style.background = "var(--bg-card-2, rgba(255,255,255,0.08))"; }}
            onMouseLeave={(e) => { e.target.style.background = "none"; }}
          >
            Clear search
          </button>
        </div>
      )}

      {filteredPosts.length === 0 && searchQuery && (
        <div style={{
          textAlign: "center",
          padding: "3rem 1rem",
          color: "var(--text-muted, #666)",
        }}>
          <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔍</p>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-soft, #aaa)" }}>
            No stories match your search
          </p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Try different keywords or{" "}
            <button
              type="button"
              onClick={clearSearch}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-primary, #ff5c9d)",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "inherit",
                padding: 0,
              }}
            >
              clear the search
            </button>
          </p>
        </div>
      )}

      {filteredPosts.map((post) => {
        const state = reactionState[post.id];

        return (
          <article key={post.id} className="post-card">
            <div className="post-header-top post-header-top--feed">
              <div className="post-author-avatar">{post.avatar}</div>
              <div className="post-author-info">
                <div className="post-author-row">
                  <span className="post-author-name">
                    {post.authorName}
                    {post.premium && (
                      <span className="premium-check" title="Premium Post" style={{ marginLeft: "4px", color: "var(--accent-primary)", fontSize: "0.85em" }}>
                        ✓
                      </span>
                    )}
                  </span>
                  <FollowButton
                    profileId={post.profileId}
                    profileName={post.authorName}
                    initialIsFollowing={post.isFollowingAuthor}
                    isOwnProfile={post.isOwnAuthor}
                    className="follow-btn post-follow-btn"
                  />
                </div>
                <span className="post-author-handle">{post.authorHandle}</span>
              </div>
              <div className="post-header-actions">
                <span className="post-time">{post.time}</span>
              </div>
            </div>

            <div className="post-body-mid">
              <Link
                to={`/post/${post.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
                aria-label={`Open post ${post.title}`}
              >
                <h2 className="post-title">{post.title}</h2>
              </Link>

              <p className="post-content">{post.summary || post.contentText}</p>

              <div className="post-tags-container">
                {post.tags?.map((tag) => (
                  <span key={tag} className="post-tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="post-actions-bottom">
              <button
                className="action-icon-btn like-btn"
                title="Like"
                onClick={() => onLike(post.id)}
                aria-pressed={Boolean(state?.liked)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={state?.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>{formatCompactNumber(state?.likes || 0)}</span>
              </button>

              <button
                className="action-icon-btn dislike-btn"
                title="Dislike"
                onClick={() => onDislike(post.id)}
                aria-pressed={Boolean(state?.disliked)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={state?.disliked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m14 10-2 2-2-2"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m10 14 2-2 2 2"></path>
                </svg>
                <span>{formatCompactNumber(state?.dislikes || 0)}</span>
              </button>

              <Link
                to={`/post/${post.id}#comments`}
                className="action-icon-btn comment-btn"
                title="Comment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>{formatCompactNumber(post.comments || 0)}</span>
              </Link>

              <button
                className="action-icon-btn share-btn"
                title="Share"
                onClick={() => onShare(post.id, post.title)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>

              <button
                className="action-icon-btn bookmark-btn"
                title="Bookmark"
                onClick={() => onBookmark(post.id)}
                aria-pressed={Boolean(state?.bookmarked)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={state?.bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                </svg>
                <span>{formatCompactNumber(state?.bookmarks || 0)}</span>
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default Home;
