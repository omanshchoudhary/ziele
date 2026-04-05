import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDiscoverData } from "../lib/apiClient";
import FollowButton from "../components/FollowButton";
import "./Discover.css";

function normalizeTag(value) {
  return (value || "").trim().toLowerCase().replace(/^#/, "");
}

function parseTagQuery(value) {
  return String(value || "")
    .split(",")
    .map((item) => normalizeTag(item))
    .filter(Boolean);
}

function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [discoverData, setDiscoverData] = useState({
    blogs: [],
    creators: [],
    categories: ["Recommended"],
  });
  const [error, setError] = useState("");

  const searchQueryRaw = (searchParams.get("q") || "").trim();
  const searchQuery = searchQueryRaw.toLowerCase();
  const urlTags = parseTagQuery(searchParams.get("tag"));

  useEffect(() => {
    let cancelled = false;

    getDiscoverData({ q: searchQueryRaw })
      .then((data) => {
        if (!cancelled) {
          setDiscoverData(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Unable to load discover data.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchQueryRaw]);

  useEffect(() => {
    if (urlTags.length === 0) {
      setSelectedCategories([]);
      return;
    }

    const matchedCategories = discoverData.categories.filter(
      (category) =>
        category !== "Recommended" &&
        urlTags.includes(normalizeTag(category)),
    );

    setSelectedCategories(matchedCategories);
  }, [discoverData.categories, urlTags]);

  const activeTags = useMemo(
    () => selectedCategories.map((category) => normalizeTag(category)),
    [selectedCategories],
  );

  const visibleBlogs = useMemo(() => {
    if (activeTags.length === 0) {
      return discoverData.blogs;
    }

    return discoverData.blogs.filter((blog) =>
      activeTags.includes(normalizeTag(blog.category)),
    );
  }, [activeTags, discoverData.blogs]);

  const updateParams = (updater) => {
    const next = new URLSearchParams(searchParams);
    updater(next);
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    updateParams((params) => {
      params.delete("tag");
    });
  };

  const toggleCategory = (category) => {
    if (category === "Recommended") {
      resetFilters();
      return;
    }

    setSelectedCategories((current) => {
      const exists = current.includes(category);
      const next = exists
        ? current.filter((item) => item !== category)
        : [...current, category];

      updateParams((params) => {
        if (next.length === 0) {
          params.delete("tag");
        } else {
          params.set(
            "tag",
            next.map((item) => normalizeTag(item)).join(","),
          );
        }
      });

      return next;
    });
  };

  const showCreatorPanel = visibleBlogs.length >= 4;
  const leadingBlogs = showCreatorPanel
    ? visibleBlogs.slice(0, 4)
    : visibleBlogs;
  const trailingBlogs = showCreatorPanel ? visibleBlogs.slice(4) : [];

  return (
    <div className="page discover-page">
      <div className="discover-intro">
        <h1>Discover</h1>
        <p>
          Browse trending stories, learn from top creators, and discover content
          tailored to your interests.
        </p>

        {(searchQuery || activeTags.length > 0) && (
          <p className="discover-results-hint">
            Showing results
            {searchQuery ? ` for "${searchQueryRaw}"` : ""}
            {activeTags.length > 0
              ? `${searchQuery ? " and" : " for"} ${activeTags
                  .map((tag) => `#${tag}`)
                  .join(", ")}`
              : ""}
            .
          </p>
        )}
      </div>

      {error ? <p className="discover-results-hint">{error}</p> : null}

      <nav className="discover-nav" aria-label="Discover categories">
        {discoverData.categories.map((category) => {
          const isActive =
            category === "Recommended"
              ? selectedCategories.length === 0
              : selectedCategories.includes(category);

          return (
            <button
              key={category}
              type="button"
              className={`discover-nav-item ${isActive ? "active" : ""}`}
              onClick={() => toggleCategory(category)}
              aria-pressed={isActive}
            >
              {category}
            </button>
          );
        })}
      </nav>

      <div className="discover-layout">
        <section className="discover-list">
          {visibleBlogs.length === 0 ? (
            <article className="discover-card discover-empty-state">
              <div className="discover-card-meta">
                <span>No matches</span>
                <button
                  type="button"
                  className="read-now-btn"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
              <h2 className="discover-card-title">No posts found</h2>
              <p className="discover-card-summary">
                We could not find content matching your current filters. Try a
                different search term or switch back to Recommended.
              </p>
            </article>
          ) : (
            <>
              {leadingBlogs.map((blog) => (
                <article key={blog.id} className="discover-card">
                  <div className="discover-card-meta">
                    <span>{blog.category}</span>
                    <span>{blog.views} views</span>
                  </div>
                  <div className="discover-card-author">
                    <div className="discover-card-author-main">
                      <div className="discover-card-author-topline">
                        <span className="discover-card-author-name">
                          {blog.author}
                        </span>
                        <span className="discover-card-author-dot">•</span>
                        <span className="discover-card-author-time">
                          {blog.time || "Just now"}
                        </span>
                        <FollowButton
                          profileId={blog.profileId}
                          profileName={blog.author}
                          initialIsFollowing={blog.isFollowingAuthor}
                          isOwnProfile={blog.isOwnAuthor}
                          className="discover-card-follow-btn follow-btn"
                        />
                      </div>
                      <span className="discover-card-author-handle">
                        {blog.authorHandle || "@creator"}
                      </span>
                    </div>
                  </div>
                  <h2 className="discover-card-title">{blog.title}</h2>
                  <p className="discover-card-summary">{blog.summary}</p>
                  <div className="discover-card-meta discover-card-footer">
                    <span>{blog.readTime}</span>
                    <Link
                      to={`/post/${blog.id}`}
                      className="read-now-btn"
                      aria-label={`Read ${blog.title}`}
                    >
                      Read now →
                    </Link>
                  </div>
                  <div className="card-tags">
                    <span className="card-tag">#discover</span>
                    <span className="card-tag">
                      #{blog.category.toLowerCase()}
                    </span>
                  </div>
                </article>
              ))}

              {showCreatorPanel && (
                <section
                  className="suggestion-panel"
                  aria-label="Suggested creators"
                >
                  <div className="suggestions-header">
                    <div>
                      <h2>Keep up with creators</h2>
                      <p className="suggestion-subtitle">
                        Explore creator profiles designed for inspiration and
                        discovery.
                      </p>
                    </div>
                    <Link to="/connections">View all</Link>
                  </div>

                  <div className="creator-grid">
                    {discoverData.creators.map((profile) => (
                      <article key={profile.id} className="creator-card">
                        <div className="creator-top-block">
                          <div className="creator-top-avatar">
                            {profile.initials}
                          </div>
                        </div>
                        <div className="creator-card-body">
                          <div className="creator-name-row">
                            <Link
                              to={`/profile/${encodeURIComponent(profile.id)}`}
                              className="creator-name"
                            >
                              {profile.name}
                            </Link>
                            <p className="creator-username">{profile.handle}</p>
                          </div>
                          <p className="creator-bio">{profile.note}</p>
                        </div>
                        <div className="creator-card-footer">
                          <div className="creator-card-stats">
                            <span className="creator-stat">
                              <span className="creator-stat-icon followers" />
                              {profile.followers}
                            </span>
                            <span className="creator-stat">
                              <span className="creator-stat-icon posts" />
                              {profile.posts}
                            </span>
                          </div>
                          <FollowButton
                            profileId={profile.id}
                            profileName={profile.name}
                            initialIsFollowing={profile.isFollowing}
                            isOwnProfile={profile.isOwnProfile}
                            className="creator-follow-btn follow-btn"
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {trailingBlogs.map((blog) => (
                <article key={blog.id} className="discover-card">
                  <div className="discover-card-meta">
                    <span>{blog.category}</span>
                    <span>{blog.views} views</span>
                  </div>
                  <div className="discover-card-author">
                    <div className="discover-card-author-main">
                      <div className="discover-card-author-topline">
                        <span className="discover-card-author-name">
                          {blog.author}
                        </span>
                        <span className="discover-card-author-dot">•</span>
                        <span className="discover-card-author-time">
                          {blog.time || "Just now"}
                        </span>
                        <FollowButton
                          profileId={blog.profileId}
                          profileName={blog.author}
                          initialIsFollowing={blog.isFollowingAuthor}
                          isOwnProfile={blog.isOwnAuthor}
                          className="discover-card-follow-btn follow-btn"
                        />
                      </div>
                      <span className="discover-card-author-handle">
                        {blog.authorHandle || "@creator"}
                      </span>
                    </div>
                  </div>
                  <h2 className="discover-card-title">{blog.title}</h2>
                  <p className="discover-card-summary">{blog.summary}</p>
                  <div className="discover-card-meta discover-card-footer">
                    <span>{blog.readTime}</span>
                    <Link
                      to={`/post/${blog.id}`}
                      className="read-now-btn"
                      aria-label={`Read ${blog.title}`}
                    >
                      Read now →
                    </Link>
                  </div>
                  <div className="card-tags">
                    <span className="card-tag">#discover</span>
                    <span className="card-tag">
                      #{blog.category.toLowerCase()}
                    </span>
                  </div>
                </article>
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Discover;
