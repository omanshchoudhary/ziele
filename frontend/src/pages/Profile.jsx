import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/profile.css";
import "../components/PostCard.css";
import {
  getProfileById,
  mockPosts,
  formatCompactNumber,
} from "../data/mockData";

const tabs = ["Stories", "Drafts", "Bookmarks", "About"];

function getPostsForProfile(handle) {
  if (!handle) return [];
  const normalized = handle.toLowerCase().replace(/^@/, "");
  return mockPosts.filter(
    (post) => post.authorHandle.toLowerCase().replace(/^@/, "") === normalized,
  );
}

function Profile() {
  const { id } = useParams();
  const profile = useMemo(() => getProfileById(id), [id]);
  const profilePosts = useMemo(
    () => getPostsForProfile(profile?.handle),
    [profile?.handle],
  );

  const [activeTab, setActiveTab] = useState("Stories");
  const [followed, setFollowed] = useState(false);

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="page profile-stack">
          <h1 className="profile-page-title-inline">Profile not found</h1>
          <p className="profile-muted-text">
            The profile you’re looking for doesn’t exist.
          </p>
          <div>
            <Link to="/" className="back-btn">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} on Ziele`,
          text: `Check out ${profile.name}'s profile on Ziele`,
          url: profileUrl,
        });
        return;
      } catch {
        // fallback below
      }
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      window.alert("Profile link copied to clipboard!");
    } catch {
      window.alert(`Share this profile: ${profileUrl}`);
    }
  };

  const renderTabContent = () => {
    if (activeTab === "Stories") {
      if (profilePosts.length === 0) {
        return (
          <div className="page profile-page-block">
            <p className="profile-muted-text">No stories published yet.</p>
          </div>
        );
      }

      return (
        <div className="profile-feed">
          {profilePosts.map((post) => (
            <article key={post.id} className="post-card">
              <div className="post-header-top">
                <div className="post-author-avatar">{post.avatar}</div>
                <div className="post-author-info">
                  <span className="post-author-name">{post.authorName}</span>
                  <span className="post-author-handle">
                    {post.authorHandle}
                  </span>
                </div>
                <span className="post-time">{post.time}</span>
              </div>

              <div className="post-body-mid">
                <h2 className="post-title">{post.title}</h2>
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
                <button className="action-icon-btn like-btn" title="Like">
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
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span>{formatCompactNumber(post.likes || 0)}</span>
                </button>

                <button className="action-icon-btn dislike-btn" title="Dislike">
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
                    <path d="m14 10-2 2-2-2"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m10 14 2-2 2 2"></path>
                  </svg>
                  <span>{formatCompactNumber(post.dislikes || 0)}</span>
                </button>

                <button className="action-icon-btn share-btn" title="Share">
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
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                  </svg>
                  <span>{formatCompactNumber(post.bookmarks || 0)}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (activeTab === "About") {
      return (
        <div className="page profile-page-block profile-stack-sm">
          <h2 className="profile-page-title-inline">About {profile.name}</h2>
          <p className="profile-soft-text">{profile.bio}</p>
          <p className="profile-muted-text">Joined: {profile.joined}</p>
          <p className="profile-muted-text">
            Current streak: {profile.streak} days
          </p>
        </div>
      );
    }

    return (
      <div className="page profile-page-block">
        <p className="profile-muted-text">
          {activeTab} is being prepared. You’ll see this section soon.
        </p>
      </div>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-glass-card">
        <div className="profile-header-main">
          <div className="profile-avatar-elite">
            {profile.avatar}
            <div className="profile-status-dot"></div>
          </div>

          <div className="profile-identity">
            <h1 className="profile-name-elite">
              {profile.name}
              {profile.isPremium && (
                <span className="premium-check" title="Verified Author">
                  ✓
                </span>
              )}
            </h1>
            <p className="profile-handle-elite">{profile.handle}</p>
          </div>

          <div className="profile-cta-group">
            <button
              className="nav-btn-primary"
              type="button"
              onClick={() => setFollowed((prev) => !prev)}
            >
              {followed ? "Following" : "Follow"}
            </button>

            <button
              className="action-icon-btn profile-share-btn"
              type="button"
              onClick={handleShare}
              title="Share profile"
              aria-label="Share profile"
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
          </div>
        </div>

        <p className="profile-bio-elite">{profile.bio}</p>

        <div className="profile-stats-elite">
          <div className="elite-stat">
            <span className="stat-value">
              {formatCompactNumber(profile.posts)}
            </span>
            <span className="stat-label">Stories</span>
          </div>
          <div className="elite-stat">
            <span className="stat-value">
              {formatCompactNumber(profile.followers)}
            </span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="elite-stat">
            <span className="stat-value">
              {formatCompactNumber(profile.following)}
            </span>
            <span className="stat-label">Following</span>
          </div>
          <div className="elite-stat">
            <span className="stat-value">
              {formatCompactNumber(profile.likes)}
            </span>
            <span className="stat-label">Likes</span>
          </div>
        </div>
      </div>

      <div className="profile-nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`profile-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
            type="button"
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
}

export default Profile;
