import React, { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  factCheckPostContent,
  getPostById,
  getRelatedPosts,
  reactToPost,
  summarizePostContent,
  toggleBookmark,
  translatePostContent,
} from "../lib/apiClient";
import FollowButton from "../components/FollowButton";
import MediaAttachment from "../components/MediaAttachment";
import { formatCompactNumber } from "../lib/formatters";
import CommentSection from "../components/CommentSection";
import "../components/PostCard.css";
import "./PostDetail.css";

const AI_LANGUAGES = ["English", "Hindi", "Spanish", "French", "German"];

function PostDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiLanguage, setAiLanguage] = useState("English");
  const [translatedText, setTranslatedText] = useState("");
  const [translationMessage, setTranslationMessage] = useState("");
  const [summaryResult, setSummaryResult] = useState(null);
  const [moderationResult, setModerationResult] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isCheckingModeration, setIsCheckingModeration] = useState(false);
  const [isSavingReaction, setIsSavingReaction] = useState(false);

  useEffect(() => {
    if (location.hash === "#comments") {
      const element = document.getElementById("comments");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError("");

    Promise.all([getPostById(id), getRelatedPosts(id)])
      .then(([postData, relatedData]) => {
        if (cancelled) return;
        setPost(postData);
        setRelatedPosts(relatedData);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load this post.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const scrollToComments = () => {
    const element = document.getElementById("comments");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likes, setLikes] = useState(post?.likes || 0);
  const [dislikes, setDislikes] = useState(post?.dislikes || 0);
  const [bookmarks, setBookmarks] = useState(post?.bookmarks || 0);

  useEffect(() => {
    setLikes(post?.likes || 0);
    setDislikes(post?.dislikes || 0);
    setBookmarks(post?.bookmarks || 0);
    setLiked(post?.viewerReaction === "like");
    setDisliked(post?.viewerReaction === "dislike");
    setBookmarked(Boolean(post?.isBookmarked));
    setTranslatedText("");
    setTranslationMessage("");
    setSummaryResult(null);
  }, [post]);

  useEffect(() => {
    if (!post) return undefined;

    let cancelled = false;
    setIsCheckingModeration(true);

    // We automatically request moderation hints for the reader view so the
    // trust signals stay close to the content they describe.
    factCheckPostContent({
      title: post.title,
      text: post.contentText || post.content,
      tags: post.tags || [],
    })
      .then((result) => {
        if (!cancelled) {
          setModerationResult(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setModerationResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingModeration(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [post]);

  const handleReaction = async (type) => {
    if (!post || isSavingReaction) return;

    setIsSavingReaction(true);
    try {
      const response = await reactToPost(post.id, type);
      if (response?.post) {
        setPost(response.post);
        setLikes(response.post.likes || 0);
        setDislikes(response.post.dislikes || 0);
        setLiked(response.reaction === "like");
        setDisliked(response.reaction === "dislike");
      }
    } catch (reactionError) {
      window.alert(reactionError.message || "Unable to save your reaction.");
    } finally {
      setIsSavingReaction(false);
    }
  };

  const onBookmark = () => {
    if (!post?.id) return;

    toggleBookmark(post.id)
      .then((response) => {
        if (!response?.post) return;

        setPost((current) => ({ ...(current || {}), ...response.post }));
        setBookmarked(Boolean(response.bookmarked));
        setBookmarks(response.post.bookmarks || 0);
      })
      .catch((bookmarkError) => {
        window.alert(bookmarkError.message || "Unable to save bookmark.");
      });
  };

  const handleTranslate = async () => {
    if (!post) return;

    setIsTranslating(true);
    try {
      const result = await translatePostContent({
        text: post.contentText || post.content,
        targetLanguage: aiLanguage,
      });
      setTranslatedText(result.translatedText || "");
      setTranslationMessage(result.message || "");
    } catch (translationError) {
      setTranslationMessage(
        translationError.message || "Unable to translate this post right now.",
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSummarize = async () => {
    if (!post) return;

    setIsSummarizing(true);
    try {
      const result = await summarizePostContent({
        title: post.title,
        text: post.contentText || post.content,
        targetLanguage: aiLanguage,
      });
      setSummaryResult(result);
    } catch (summaryError) {
      setSummaryResult({
        summary: "",
        message: summaryError.message || "Unable to summarize this post right now.",
        fallbackUsed: true,
        keyPoints: [],
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const onShare = async () => {
    const shareUrl = `${window.location.origin}${post?.sharePath || `/post/${id}`}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title || "Post",
          text: "Check out this post on Ziele",
          url: shareUrl,
        });
        return;
      } catch {
        // fallback below
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
    return (
      <div className="page">
        <div className="post-detail-not-found">
          <h1 className="post-detail-not-found-title">Loading post...</h1>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page">
        <div className="post-detail-not-found">
          <h1 className="post-detail-not-found-title">Post not found</h1>
          <p className="post-detail-not-found-text">
            {error ||
              "The post you are looking for doesn't exist or may have been removed."}
          </p>
          <div>
            <Link to="/feed" className="back-btn">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page post-detail-page">
      <div className="post-detail-back-row">
        <Link to="/feed" className="back-btn post-detail-back-btn">
          ← Back to Home
        </Link>
      </div>

      <article className="post-detail-main-card">
        <div className="post-header-top">
          <div className="post-author-avatar">{post.avatar}</div>
          <div className="post-author-info">
            <span className="post-author-name">{post.authorName}</span>
            <span className="post-author-handle">{post.authorHandle}</span>
          </div>
          <FollowButton
            profileId={post.profileId}
            profileName={post.authorName}
            initialIsFollowing={post.isFollowingAuthor}
            isOwnProfile={post.isOwnAuthor}
            className="follow-btn post-follow-btn"
          />
          <span className="post-time">{post.time}</span>
        </div>

        <div className="post-body-mid post-detail-body">
          <h1 className="post-title post-detail-title">{post.title}</h1>

          <div className="post-detail-meta-row">
            <span>{formatCompactNumber(post.views || 0)} views</span>
            <span>•</span>
            <span>{post.readTime || "5 min read"}</span>
          </div>

          <div className="post-tags-container">
            {post.tags?.map((tag) => (
              <span key={tag} className="post-tag-pill">
                {tag}
              </span>
            ))}
          </div>

          {moderationResult ? (
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div className="post-tags-container">
                <span className="post-tag-pill">{moderationResult.label}</span>
                <span className="post-tag-pill">
                  Confidence {Math.round((moderationResult.confidence || 0) * 100)}%
                </span>
                {moderationResult.fallbackUsed ? (
                  <span className="post-tag-pill">Fallback</span>
                ) : null}
              </div>
              <p>{moderationResult.summary}</p>
              <p style={{ opacity: 0.8 }}>{moderationResult.factCheck}</p>
              <p style={{ opacity: 0.8 }}>
                {isCheckingModeration
                  ? "Refreshing moderation hints..."
                  : moderationResult.message}
              </p>
              {moderationResult.flags?.length ? (
                <div className="post-tags-container">
                  {moderationResult.flags.map((flag) => (
                    <span key={flag.code} className="post-tag-pill">
                      {flag.label} ({flag.severity})
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <MediaAttachment
            mediaUrl={post.mediaUrl}
            mediaType={post.mediaType}
            alt={post.title}
            className="post-media-shell post-detail-media-shell"
          />

          <div
            className="post-detail-paragraphs"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        <div className="post-actions-bottom post-detail-actions">
          <button
            className="action-icon-btn like-btn"
            title="Like"
            onClick={() => handleReaction("like")}
            aria-pressed={liked}
            disabled={isSavingReaction}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{formatCompactNumber(likes)}</span>
          </button>

          <button
            className="action-icon-btn dislike-btn"
            title="Dislike"
            onClick={() => handleReaction("dislike")}
            aria-pressed={disliked}
            disabled={isSavingReaction}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={disliked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m14 10-2 2-2-2" />
              <circle cx="12" cy="12" r="10" />
              <path d="m10 14 2-2 2 2" />
            </svg>
            <span>{formatCompactNumber(dislikes)}</span>
          </button>

          <button
            className="action-icon-btn comment-btn"
            title="Comment"
            onClick={scrollToComments}
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
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{formatCompactNumber(post.comments || 0)}</span>
          </button>

          <button
            className="action-icon-btn share-btn"
            title="Share"
            onClick={onShare}
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
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>

          <button
            className="action-icon-btn bookmark-btn"
            title="Bookmark"
            onClick={onBookmark}
            aria-pressed={bookmarked}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={bookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            <span>{formatCompactNumber(bookmarks)}</span>
          </button>
        </div>
      </article>

      <section
        className="post-card"
        style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>AI language</span>
            <select
              value={aiLanguage}
              onChange={(event) => setAiLanguage(event.target.value)}
              style={{
                minWidth: "180px",
                padding: "0.65rem 0.85rem",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                color: "inherit",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {AI_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="follow-btn"
            onClick={handleTranslate}
            disabled={isTranslating}
          >
            {isTranslating ? "Translating..." : "Translate"}
          </button>

          <button
            type="button"
            className="follow-btn"
            onClick={handleSummarize}
            disabled={isSummarizing}
          >
            {isSummarizing ? "Summarizing..." : "Summarize"}
          </button>
        </div>

        {translationMessage ? (
          <p style={{ opacity: 0.8 }}>{translationMessage}</p>
        ) : null}

        {translatedText ? (
          <div>
            <h2 className="post-detail-related-title">Translated text</h2>
            <p>{translatedText}</p>
          </div>
        ) : null}

        {summaryResult ? (
          <div>
            <h2 className="post-detail-related-title">AI summary</h2>
            <p>{summaryResult.summary}</p>
            {summaryResult.message ? (
              <p style={{ opacity: 0.8 }}>{summaryResult.message}</p>
            ) : null}
            {summaryResult.keyPoints?.length ? (
              <div className="post-tags-container">
                {summaryResult.keyPoints.map((point) => (
                  <span key={point} className="post-tag-pill">
                    {point}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <CommentSection postId={id} />

      <section className="post-detail-related">
        <h2 className="post-detail-related-title">Related posts</h2>

        {relatedPosts.length === 0 ? (
          <p className="post-detail-related-empty">
            No related posts available right now.
          </p>
        ) : (
          <div className="post-detail-related-list">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                to={`/post/${related.id}`}
                className="post-card post-detail-related-card"
              >
                <div className="post-header-top">
                  <div className="post-author-avatar">{related.avatar}</div>
                  <div className="post-author-info">
                    <span className="post-author-name">
                      {related.authorName}
                    </span>
                    <span className="post-author-handle">
                      {related.authorHandle}
                    </span>
                  </div>
                  <span className="post-time">{related.time}</span>
                </div>
                <div className="post-body-mid">
                  <h3 className="post-title post-detail-related-card-title">
                    {related.title}
                  </h3>
                  <p className="post-content">
                    {related.summary || related.contentText}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default PostDetail;
