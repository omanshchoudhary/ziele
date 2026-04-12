import React from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import "./LandingPage.css";

const STAGE_FEATURES = [
  { label: "AI Summaries", value: "Multi-language insights" },
  { label: "Live Alerts", value: "Realtime social notifications" },
  { label: "Trending", value: "Fast-moving stories and topics" },
];

function LandingPage({ isDarkTheme = true, onToggleTheme = () => {} }) {
  const stageRef = React.useRef(null);

  const handleStageMove = (event) => {
    const node = stageRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    node.style.setProperty("--stage-tilt-x", `${x * 18}deg`);
    node.style.setProperty("--stage-tilt-y", `${-y * 16}deg`);
  };

  const resetStageTilt = () => {
    const node = stageRef.current;
    if (!node) return;

    node.style.setProperty("--stage-tilt-x", "0deg");
    node.style.setProperty("--stage-tilt-y", "0deg");
  };

  return (
    <div className="landing-page">
      <div className="landing-bg-grid" aria-hidden="true" />

      <header className="landing-topbar">
        <div className="landing-brand">
          Ziele
          <span>One Word, Infinite Meaning</span>
        </div>

        <button
          type="button"
          className="landing-theme-toggle"
          onClick={onToggleTheme}
          aria-label={
            isDarkTheme ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {isDarkTheme ? "Light mode" : "Dark mode"}
        </button>
      </header>

      <main className="landing-main">
        <section className="landing-copy">
          <p className="landing-eyebrow">Write. Connect. Discover.</p>
          <h1>Share meaningful stories with the Ziele community.</h1>
          <p className="landing-description">
            Create rich posts, translate and summarize content with AI, follow
            creators, and stay updated through realtime notifications and
            trending communities.
          </p>

          <div className="landing-options">
            <div className="landing-option-card landing-option-card-primary">
              <h2>Sign in</h2>
              <p>
                Sync your profile, publish posts, and unlock full social
                features.
              </p>

              <SignedOut>
                <Link
                  to="/sign-in"
                  className="landing-option-btn primary"
                >
                  Continue with Sign In
                </Link>
              </SignedOut>

              <SignedIn>
                <Link to="/feed" className="landing-option-btn primary">
                  Open My Feed
                </Link>
              </SignedIn>
            </div>

            <div className="landing-option-card landing-option-card-secondary">
              <h2>Browse without login</h2>
              <p>
                Explore public stories, trending topics, and communities right
                away.
              </p>
              <Link to="/feed" className="landing-option-btn secondary">
                Browse as Guest
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-visual">
          <div
            ref={stageRef}
            className="landing-stage"
            onMouseMove={handleStageMove}
            onMouseLeave={resetStageTilt}
            onBlur={resetStageTilt}
          >
            <div className="landing-stage-glow" />
            <div className="landing-orbit landing-orbit-one" />
            <div className="landing-orbit landing-orbit-two" />
            <div className="landing-core" />

            <div className="landing-float-card landing-float-card-one">
              <span>Weekly momentum</span>
              <strong>+28% creator growth</strong>
            </div>

            <div className="landing-feature-stack">
              {STAGE_FEATURES.map((item) => (
                <article key={item.label} className="landing-feature-item">
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
