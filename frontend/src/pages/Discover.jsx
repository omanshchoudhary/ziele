import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDiscoverData } from "../lib/api";
import "./Discover.css";

function normalizeTag(value) {
  return (value || "").trim().toLowerCase().replace(/^#/, "");
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
  const tagQuery = normalizeTag(searchParams.get("tag"));

  useEffect(() => {
    if (!tagQuery) return;

    const matchedCategory = discoverData.categories.find(
      (category) =>
        category !== "Recommended" && normalizeTag(category) === tagQuery,
    );

    if (matchedCategory) {
      setSelectedCategories([matchedCategory]);
    }
  }, [discoverData.categories, tagQuery]);

  useEffect(() => {
    let cancelled = false;

    getDiscoverData({
      q: searchQueryRaw,
      tag:
        selectedCategories.length === 1
          ? normalizeTag(selectedCategories[0])
          : tagQuery,
    })
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
  }, [searchQueryRaw, selectedCategories, tagQuery]);

  const visibleBlogs = useMemo(() => discoverData.blogs, [discoverData.blogs]);

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
      if (current.includes(category)) {
        const next = current.filter((item) => item !== category);
        updateParams((params) => {
          if (next.length === 0) params.delete("tag");
          else params.set("tag", normalizeTag(next[0]));
        });
        return next;
      }

      const next = [...current, category];
      if (next.length === 1) {
        updateParams((params) => {
          params.set("tag", normalizeTag(category));
        });
      }
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

        {(searchQuery || tagQuery) && (
          <p className="discover-results-hint">
            Showing results
            {searchQuery ? ` for “${searchQueryRaw}”` : ""}
            {tagQuery ? `${searchQuery ? " and " : " for "}#${tagQuery}` : ""}.
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
                We couldn’t find content matching your current filters. Try a
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
                  <h2 className="discover-card-title">{blog.title}</h2>
                  <p className="discover-card-summary">{blog.summary}</p>
                  <div className="discover-card-meta discover-card-footer">
                    <span>
                      {blog.author} · {blog.readTime}
                    </span>
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
                            <p className="creator-name">{profile.name}</p>
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
                          <button className="creator-follow-btn" type="button">
                            Follow
                          </button>
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
                  <h2 className="discover-card-title">{blog.title}</h2>
                  <p className="discover-card-summary">{blog.summary}</p>
                  <div className="discover-card-meta discover-card-footer">
                    <span>
                      {blog.author} · {blog.readTime}
                    </span>
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
