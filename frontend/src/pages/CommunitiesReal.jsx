import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCommunitiesData } from "../lib/apiClient";
import { formatCompactNumber } from "../lib/formatters";
import "./Discover.css";
import "./Communities.css";

function normalizeTag(value = "") {
  return String(value || "").trim().toLowerCase().replace(/^#/, "");
}

function CommunitiesReal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [communitiesData, setCommunitiesData] = useState({
    communities: [],
    categories: ["Recommended"],
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const searchQueryRaw = (searchParams.get("q") || "").trim();
  const searchQuery = searchQueryRaw.toLowerCase();
  const tagQuery = normalizeTag(searchParams.get("tag"));

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCommunitiesData({
      q: searchQueryRaw || undefined,
      tag: tagQuery || undefined,
    })
      .then((data) => {
        if (!cancelled) {
          setCommunitiesData({
            communities: Array.isArray(data?.communities) ? data.communities : [],
            categories: Array.isArray(data?.categories)
              ? data.categories
              : ["Recommended"],
          });
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError.message || "Unable to load communities.");
          setCommunitiesData({ communities: [], categories: ["Recommended"] });
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
  }, [searchQueryRaw, tagQuery]);

  useEffect(() => {
    if (!tagQuery) return;
    const match = communitiesData.categories.find(
      (category) =>
        category !== "Recommended" && normalizeTag(category) === tagQuery,
    );
    if (match) {
      setSelectedCategories([match]);
    }
  }, [communitiesData.categories, tagQuery]);

  const visibleCommunities = useMemo(() => {
    const filteredByCategory =
      selectedCategories.length === 0
        ? communitiesData.communities
        : communitiesData.communities.filter((community) =>
            selectedCategories.includes(community.category),
          );

    return filteredByCategory.filter((community) => {
      const matchesSearch =
        !searchQuery ||
        community.name?.toLowerCase().includes(searchQuery) ||
        community.description?.toLowerCase().includes(searchQuery) ||
        community.category?.toLowerCase().includes(searchQuery) ||
        (community.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery));

      const matchesTag =
        !tagQuery ||
        normalizeTag(community.category) === tagQuery ||
        (community.tags || []).some((tag) => normalizeTag(tag) === tagQuery);

      return matchesSearch && matchesTag;
    });
  }, [communitiesData.communities, searchQuery, selectedCategories, tagQuery]);

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

  return (
    <div className="page discover-page communities-discovery-page">
      <div className="discover-intro">
        <h1>Communities</h1>
        <p>Join focused groups built from live activity on the platform.</p>
        {error ? <p className="discover-results-hint">{error}</p> : null}
      </div>

      <nav className="discover-nav" aria-label="Community categories">
        {communitiesData.categories.map((category) => {
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
          {isLoading ? (
            <article className="discover-card discover-empty-state">
              <h2 className="discover-card-title">Loading communities...</h2>
            </article>
          ) : visibleCommunities.length === 0 ? (
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
              <h2 className="discover-card-title">No communities found</h2>
              <p className="discover-card-summary">
                Try a different search term or switch back to Recommended.
              </p>
            </article>
          ) : (
            visibleCommunities.map((community) => (
              <article key={community.id} className="discover-card community-card">
                <div className="discover-card-meta">
                  <div className="community-card-icon-wrap">
                    <span className="community-icon">#</span>
                    <span className="community-category-pill">{community.category}</span>
                  </div>
                  <span className="member-count">
                    {formatCompactNumber(community.members || 0)} members
                  </span>
                </div>

                <h2 className="discover-card-title community-name">{community.name}</h2>
                <p className="discover-card-summary community-desc">{community.description}</p>

                <div className="discover-card-footer">
                  <div className="card-tags">
                    {(community.tags || []).map((tag) => (
                      <span key={tag} className="card-tag">#{normalizeTag(tag)}</span>
                    ))}
                  </div>
                  <button type="button" className="read-now-btn join-community-btn">
                    Join
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

export default CommunitiesReal;

