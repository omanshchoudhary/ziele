import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./Analytics.css";

/* ─── Constants ─────────────────────────────────────────────── */

const PERIODS = ["7D", "30D", "90D", "1Y"];

const STATS = [
  { icon: "🔥", label: "Active Streak", value: "14 Days",  change: "+3 days", up: true  },
  { icon: "👥", label: "Followers",     value: "12,840",   change: "+8.2%",   up: true  },
  { icon: "❤️", label: "Likes",         value: "48,293",   change: "+12.4%",  up: true  },
  { icon: "💬", label: "Comments",      value: "9,174",    change: "+5.1%",   up: true  },
  { icon: "🔗", label: "Shares",        value: "3,612",    change: "-2.3%",   up: false },
];

const MONTHLY_DATA = [
  { month: "Jan", followers: 420  },
  { month: "Feb", followers: 610  },
  { month: "Mar", followers: 540  },
  { month: "Apr", followers: 780  },
  { month: "May", followers: 920  },
  { month: "Jun", followers: 1100 },
  { month: "Jul", followers: 980  },
  { month: "Aug", followers: 1350 },
  { month: "Sep", followers: 1200 },
  { month: "Oct", followers: 1480 },
  { month: "Nov", followers: 1620 },
  { month: "Dec", followers: 1890 },
];

const LOCATION_DATA = [
  { name: "USA",     value: 34 },
  { name: "UK",      value: 18 },
  { name: "Germany", value: 12 },
  { name: "India",   value: 16 },
  { name: "Others",  value: 20 },
];
const LOCATION_COLORS = ["#ff5c9d", "#7c3aed", "#60a5fa", "#34d399", "#facc15"];

const ENGAGEMENT_DATA = [
  { name: "Liked & Followed", value: 22 },
  { name: "Liked Only",       value: 18 },
  { name: "Followed Only",    value:  8 },
  { name: "No Engagement",    value: 52 },
];
const ENGAGEMENT_COLORS = ["#34d399", "#60a5fa", "#facc15", "#f87171"];

const POST_TAGS = ["#AI", "#Technology", "#Future"];

/* ─── Custom Tooltips ────────────────────────────────────────── */

const tooltipStyle = {
  background:   "var(--bg-card-2)",
  border:       "1px solid var(--glass-border)",
  borderRadius: 12,
  color:        "var(--text-main)",
  padding:      "0.6rem 1rem",
};

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ margin: 0, fontWeight: 700, color: "var(--text-soft)", fontSize: "0.82rem" }}>
        {label}
      </p>
      <p style={{ margin: "0.25rem 0 0", fontWeight: 800, color: "#ff5c9d", fontSize: "1.05rem" }}>
        {payload[0].value.toLocaleString()}
        <span style={{ fontWeight: 500, fontSize: "0.82rem", color: "var(--text-muted)", marginLeft: 4 }}>
          followers
        </span>
      </p>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={tooltipStyle}>
      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem" }}>{item.name}</p>
      <p style={{ margin: "0.2rem 0 0", fontWeight: 800, color: item.fill ?? item.color ?? "#ff5c9d", fontSize: "1rem" }}>
        {item.value}%
      </p>
    </div>
  );
}

/* ─── Reusable small bits ────────────────────────────────────── */

function ChangeBadge({ change, up }) {
  return (
    <span className={`stat-change ${up ? "up" : "down"}`}>
      {up ? "▲" : "▼"} {change}
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function Analytics() {
  const [period, setPeriod] = useState("30D");

  return (
    <div className="analytics-page">

      {/* ── 1. Header ── */}
      <div className="analytics-header">
        <div className="analytics-header-text">
          <h1 className="analytics-title">Analytics</h1>
          <p className="analytics-subtitle">Here's how your content is performing</p>
        </div>

        <div className="period-selector" role="group" aria-label="Time period">
          {PERIODS.map((p) => (
            <button
              key={p}
              className={`period-btn${period === p ? " active" : ""}`}
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Stats Row ── */}
      <div className="stats-grid">
        {STATS.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <span className="stat-icon" aria-hidden="true">{stat.icon}</span>
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value">{stat.value}</span>
            <ChangeBadge change={stat.change} up={stat.up} />
          </div>
        ))}
      </div>

      {/* ── 3. Visitor Stats Row ── */}
      <div className="visitor-grid">
        <div className="visitor-card">
          <div className="visitor-label">Unique Visitors</div>
          <div className="visitor-value">
            87,412
            <span className="visitor-trend up" aria-label="Trending up">↑</span>
          </div>
          <div className="visitor-sub">
            <ChangeBadge change="+14.3%" up={true} />
            <span className="visitor-sub-text">vs last period</span>
          </div>
          <p className="visitor-desc">Total unique users who viewed your profile or posts</p>
        </div>

        <div className="visitor-card">
          <div className="visitor-label">New Users</div>
          <div className="visitor-value">
            5,238
            <span className="visitor-trend up" aria-label="Trending up">↑</span>
          </div>
          <div className="visitor-sub">
            <ChangeBadge change="+9.7%" up={true} />
            <span className="visitor-sub-text">vs last period</span>
          </div>
          <p className="visitor-desc">First-time visitors who discovered your content</p>
        </div>
      </div>

      {/* ── 4. Followers Growth Bar Chart ── */}
      <div className="chart-card">
        <h2 className="chart-title">Followers Gained This Year</h2>
        <ResponsiveContainer
          width="100%"
          height={280}
          style={{ background: "transparent" }}
        >
          <BarChart
            data={MONTHLY_DATA}
            margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
            style={{ background: "transparent" }}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#ff5c9d" stopOpacity={1} />
                <stop offset="100%" stopColor="#ff2e8c" stopOpacity={0.85} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.055)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            />
            <Tooltip
              content={<BarTooltip />}
              cursor={{ fill: "rgba(255, 92, 157, 0.07)", radius: 6 }}
            />
            <Bar
              dataKey="followers"
              fill="url(#barGradient)"
              radius={[7, 7, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 5. Most Viewed Post ── */}
      <div className="most-viewed-card">
        <h2 className="chart-title">Most Viewed Post</h2>
        <div className="post-preview">

          <div className="post-author-row">
            <div className="post-author-avatar" aria-hidden="true">AK</div>
            <div className="post-author-info">
              <div className="post-author-name">Alex Kim</div>
              <div className="post-author-meta">@alexkim · 2 days ago</div>
            </div>
          </div>

          <div className="post-title-preview">
            The Future of AI in Creative Industries
          </div>

          <p className="post-excerpt">
            Exploring how artificial intelligence is reshaping the creative landscape,
            from generative art to automated workflows — and what it means for
            the next generation of creators...
          </p>

          <div className="post-tags">
            {POST_TAGS.map((tag) => (
              <span key={tag} className="post-tag">{tag}</span>
            ))}
          </div>

          <div className="post-view-stats">
            <span className="post-stat-item"><span className="post-stat-emoji">👁</span><strong>24,891</strong> views</span>
            <span className="post-stat-item"><span className="post-stat-emoji">❤️</span><strong>8,204</strong> likes</span>
            <span className="post-stat-item"><span className="post-stat-emoji">💬</span><strong>1,432</strong> comments</span>
            <span className="post-stat-item"><span className="post-stat-emoji">🔗</span><strong>892</strong> shares</span>
          </div>

          <div className="post-action-row">
            <button className="view-post-btn">View Post</button>
          </div>
        </div>
      </div>

      {/* ── 6. Pie Charts Row ── */}
      <div className="charts-row">

        {/* Viewer Location */}
        <div className="chart-card">
          <h2 className="chart-title">Viewer Location</h2>
          <ResponsiveContainer
            width="100%"
            height={300}
            style={{ background: "transparent" }}
          >
            <PieChart style={{ background: "transparent" }}>
              <Pie
                data={LOCATION_DATA}
                cx="50%"
                cy="44%"
                outerRadius={98}
                innerRadius={44}
                dataKey="value"
                paddingAngle={3}
                strokeWidth={0}
              >
                {LOCATION_DATA.map((_, i) => (
                  <Cell
                    key={`loc-${i}`}
                    fill={LOCATION_COLORS[i % LOCATION_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                iconType="circle"
                iconSize={9}
                formatter={(value) => (
                  <span style={{ color: "var(--text-soft)", fontSize: "0.82rem", fontWeight: 500 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Gap */}
        <div className="chart-card">
          <h2 className="chart-title">Viewed But Did Not Engage</h2>
          <ResponsiveContainer
            width="100%"
            height={300}
            style={{ background: "transparent" }}
          >
            <PieChart style={{ background: "transparent" }}>
              <Pie
                data={ENGAGEMENT_DATA}
                cx="50%"
                cy="44%"
                outerRadius={98}
                innerRadius={44}
                dataKey="value"
                paddingAngle={3}
                strokeWidth={0}
              >
                {ENGAGEMENT_DATA.map((_, i) => (
                  <Cell
                    key={`eng-${i}`}
                    fill={ENGAGEMENT_COLORS[i % ENGAGEMENT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                iconType="circle"
                iconSize={9}
                formatter={(value) => (
                  <span style={{ color: "var(--text-soft)", fontSize: "0.82rem", fontWeight: 500 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
