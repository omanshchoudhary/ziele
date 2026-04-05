import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  discoverCategories,
  mockCommunities,
  formatCompactNumber,
} from "../data/mockData";
import "./Discover.css";
import "./Communities.css";

function normalizeTag(value) {
  return (value || "").trim().toLowerCase().replace(/^#/, "");
}

function Communities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState([]);

  const searchQueryRaw = (searchParams.get("q") || "").trim();
  const searchQuery = searchQueryRaw.toLowerCase();
  const tagQuery = normalizeTag(searchParams.get("tag"));

  useEffect(() => {
    if (!tagQuery) return;

    const matchedCategory = discoverCategories.find(
      (category) =>
        category !== "Recommended" && normalizeTag(category) === tagQuery,
    );

    if (matchedCategory) {
      setSelectedCategories([matchedCategory]);
    }
  }, [tagQuery]);

  const visibleCommunities = useMemo(() => {
    const byCategory =
      selectedCategories.length === 0
        ? mockCommunities
        : mockCommunities.filter((com) =>
            selectedCategories.includes(com.category),
          );

    return byCategory.filter((com) => {
      const matchesSearch =
        searchQuery.length === 0 ||
        com.name.toLowerCase().includes(searchQuery) ||
        com.description.toLowerCase().includes(searchQuery) ||
        com.tags.some(tag => tag.toLowerCase().includes(searchQuery)) ||
        com.category.toLowerCase().includes(searchQuery);

      const matchesTag =
        tagQuery.length === 0 || 
        normalizeTag(com.category) === tagQuery ||
        com.tags.some(tag => normalizeTag(tag) === tagQuery);

      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedCategories, tagQuery]);

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
        <p>
          Discover and join specialized communities of writers, builders, and learners. 
          Collaborate on topics you care about.
        </p>

        {(searchQuery || tagQuery) && (
          <p className="discover-results-hint">
            Showing results
            {searchQuery ? ` for “${searchQueryRaw}”` : ""}
            {tagQuery ? `${searchQuery ? " and " : " for "}#${tagQuery}` : ""}.
          </p>
        )}
      </div>

      <nav className="discover-nav" aria-label="Community categories">
        {discoverCategories.map((category) => {
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
          {visibleCommunities.length === 0 ? (
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
                We couldn’t find communities matching your current filters. Try a
                different search term or switch back to Recommended.
              </p>
            </article>
          ) : (
            visibleCommunities.map((com) => (
              <article key={com.id} className="discover-card community-card">
                <div className="discover-card-meta">
                  <div className="community-card-icon-wrap">
                    <span className="community-icon">{com.icon}</span>
                    <span className="community-category-pill">{com.category}</span>
                  </div>
                  <span className="member-count">
                    {formatCompactNumber(com.members)} members
                  </span>
                </div>

                <h2 className="discover-card-title community-name">{com.name}</h2>
                <p className="discover-card-summary community-desc">{com.description}</p>
                
                <div className="discover-card-footer">
                  <div className="card-tags">
                    {com.tags.map(tag => (
                      <span key={tag} className="card-tag">#{tag.toLowerCase()}</span>
                    ))}
                  </div>
                  <button className="read-now-btn join-community-btn">
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

export default Communities;
