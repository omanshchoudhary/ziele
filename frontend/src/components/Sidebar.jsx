import React from "react";
import { Link } from "react-router-dom";
import { getSidebarData } from "../lib/apiClient";
import FollowButton from "./FollowButton";
import { formatCompactNumber } from "../lib/formatters";
import "./Sidebar.css";

function Sidebar() {
  const [sidebarData, setSidebarData] = React.useState({
    trendingTopics: [],
    suggestions: [],
  });

  React.useEffect(() => {
    let cancelled = false;

    getSidebarData()
      .then((data) => {
        if (!cancelled) setSidebarData(data);
      })
      .catch(() => {
        if (!cancelled) {
          setSidebarData({ trendingTopics: [], suggestions: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <section
        className="sidebar-section trending-section"
        aria-labelledby="sidebar-trending-heading"
      >
        <div className="sidebar-section-header">
          <h3 id="sidebar-trending-heading">What&apos;s happening</h3>
          <Link to="/trending" className="sidebar-inline-link">
            Explore
          </Link>
        </div>

        {sidebarData.trendingTopics.map((item) => (
          <Link
            key={item.tag}
            to={`/discover?tag=${encodeURIComponent(item.tag.replace("#", ""))}`}
            className="trending-item"
            aria-label={`Open trending topic ${item.topic}`}
          >
            <span className="trending-tag">{item.tag}</span>
            <span className="trending-topic">{item.topic}</span>
            <span className="trending-meta">
              {formatCompactNumber(item.posts)} posts
            </span>
          </Link>
        ))}

        <Link to="/trending" className="show-more">
          Show more
        </Link>
      </section>

      <section
        className="sidebar-section suggestions-section"
        aria-labelledby="sidebar-follow-heading"
      >
        <div className="sidebar-section-header">
          <h3 id="sidebar-follow-heading">Who to follow</h3>
          <Link to="/connections" className="sidebar-inline-link">
            View all
          </Link>
        </div>

        {sidebarData.suggestions.map((user) => (
          <div key={user.handle} className="suggestion-item">
            <div className="user-avatar" aria-hidden="true">
              {user.avatar}
            </div>

            <div className="user-info">
              <Link
                to={`/profile/${encodeURIComponent(user.handle.replace("@", ""))}`}
                className="user-name-link"
              >
                <span className="user-name">{user.name}</span>
              </Link>
              <span className="user-handle">{user.handle}</span>
            </div>
            <FollowButton
              profileId={user.id}
              profileName={user.name}
              initialIsFollowing={user.isFollowing}
              isOwnProfile={user.isOwnProfile}
              className="follow-btn"
            />
          </div>
        ))}

        <Link to="/connections" className="show-more">
          Show more
        </Link>
      </section>

      <footer className="sidebar-footer">
        <div className="sidebar-footer-links">
          <Link to="/more">Terms</Link>
          <span>·</span>
          <Link to="/more">Privacy</Link>
          <span>·</span>
          <Link to="/more">Cookies</Link>
          <span>·</span>
          <Link to="/more">Accessibility</Link>
          <span>·</span>
          <Link to="/more">Ads info</Link>
        </div>
        <p>© 2026 Ziele, Inc.</p>
      </footer>
    </aside>
  );
}

export default Sidebar;
