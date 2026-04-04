import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { mockPosts, formatCompactNumber } from "../data/mockData";
import "../components/PostCard.css";

function Home() {
  const [reactionState, setReactionState] = useState(() =>
    mockPosts.reduce((acc, post) => {
      acc[post.id] = {
        liked: false,
        disliked: false,
        bookmarked: false,
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        bookmarks: post.bookmarks || 0,
      };
      return acc;
    }, {}),
  );

  const sortedPosts = useMemo(() => {
    return [...mockPosts].sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, []);

  const onLike = (postId) => {
    setReactionState((current) => {
      const previous = current[postId];
      if (!previous) return current;

      const next = { ...previous };

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

      return { ...current, [postId]: next };
    });
  };

  const onDislike = (postId) => {
    setReactionState((current) => {
      const previous = current[postId];
      if (!previous) return current;

      const next = { ...previous };

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

      return { ...current, [postId]: next };
    });
  };

  const onBookmark = (postId) => {
    setReactionState((current) => {
      const previous = current[postId];
      if (!previous) return current;

      const next = { ...previous };
      next.bookmarked = !next.bookmarked;
      next.bookmarks = next.bookmarked
        ? next.bookmarks + 1
        : Math.max(0, next.bookmarks - 1);

      return { ...current, [postId]: next };
    });
  };

  const onShare = async (postId, title) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out this post on Ziele: ${title}`,
          url: shareUrl,
        });
        return;
      } catch {
        // user cancelled or share failed -> fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert("Post link copied to clipboard!");
    } catch {
      window.alert(`Share this link: ${shareUrl}`);
    }
  };

  return (
    <div className="feed">
      {sortedPosts.map((post) => {
        const state = reactionState[post.id];

        return (
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
              <Link
                to={`/post/${post.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
                aria-label={`Open post ${post.title}`}
              >
                <h2 className="post-title">{post.title}</h2>
              </Link>

              <p className="post-content">{post.content}</p>

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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={state?.liked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={state?.disliked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m14 10-2 2-2-2"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m10 14 2-2 2 2"></path>
                </svg>
                <span>{formatCompactNumber(state?.dislikes || 0)}</span>
              </button>

              <button
                className="action-icon-btn share-btn"
                title="Share"
                onClick={() => onShare(post.id, post.title)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={state?.bookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
