import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalyticsData } from "../lib/apiClient";
import { formatCompactNumber } from "../lib/formatters";
import "./Analytics.css";

const PERIODS = [7, 30, 90];

function formatSeriesDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AnalyticsReal() {
  const [period, setPeriod] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    getAnalyticsData({ range: period })
      .then((data) => {
        if (!cancelled) {
          setAnalytics(data || null);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError.message || "Unable to load analytics.");
          setAnalytics(null);
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
  }, [period]);

  const series = useMemo(
    () =>
      (analytics?.series || []).map((point) => ({
        ...point,
        dateLabel: formatSeriesDate(point.date),
      })),
    [analytics?.series],
  );

  if (isLoading) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <div className="analytics-header-text">
            <h1 className="analytics-title">Analytics</h1>
            <p className="analytics-subtitle">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const totals = analytics?.totals || {};

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="analytics-header-text">
          <h1 className="analytics-title">Analytics</h1>
          <p className="analytics-subtitle">
            Live metrics for your content performance in the last {period} days.
          </p>
          {error ? <p className="analytics-subtitle">{error}</p> : null}
        </div>

        <div className="period-selector" role="group" aria-label="Time period">
          {PERIODS.map((value) => (
            <button
              key={value}
              type="button"
              className={`period-btn${period === value ? " active" : ""}`}
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
            >
              {value}D
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Posts</span>
          <span className="stat-value">{formatCompactNumber(totals.posts || 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Views</span>
          <span className="stat-value">{formatCompactNumber(totals.views || 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Likes</span>
          <span className="stat-value">{formatCompactNumber(totals.likes || 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Comments</span>
          <span className="stat-value">{formatCompactNumber(totals.comments || 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Followers</span>
          <span className="stat-value">{formatCompactNumber(totals.followers || 0)}</span>
        </div>
      </div>

      <div className="chart-card">
        <h2 className="chart-title">Daily Views</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="dateLabel" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="views" fill="#ff5c9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h2 className="chart-title">Engagement Trend</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="dateLabel" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="likes" stroke="#34d399" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="comments" stroke="#60a5fa" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="dislikes" stroke="#f87171" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="most-viewed-card">
        <h2 className="chart-title">Top Posts</h2>
        {(analytics?.topPosts || []).length === 0 ? (
          <p>No post metrics yet.</p>
        ) : (
          <div className="post-view-stats">
            {(analytics?.topPosts || []).map((post) => (
              <span key={post.id} className="post-stat-item">
                {post.title}: {formatCompactNumber(post.views || 0)} views
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsReal;

