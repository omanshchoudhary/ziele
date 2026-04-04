import React from "react";
import { useLocation, Link } from "react-router-dom";

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "60vh",
  padding: "2rem",
  background: "var(--bg-elevated)",
  backdropFilter: "blur(10px)",
  borderRadius: "24px",
  border: "1px solid var(--glass-border)",
  margin: "2rem",
  color: "var(--text-main)",
};

const titleStyle = {
  fontSize: "2.5rem",
  fontWeight: "800",
  marginBottom: "1rem",
  background: "linear-gradient(45deg, var(--text-main), var(--primary))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const descriptionStyle = {
  color: "var(--text-muted)",
  fontSize: "1.1rem",
  maxWidth: "500px",
  textAlign: "center",
  lineHeight: "1.6",
};

const backButtonStyle = {
  marginTop: "2rem",
  padding: "0.8rem 2rem",
  background: "var(--primary)",
  color: "var(--text-inverse)",
  textDecoration: "none",
  borderRadius: "99px",
  fontWeight: "600",
  border: "1px solid color-mix(in srgb, var(--primary) 40%, transparent)",
  transition: "all 0.3s ease",
};

function toTitleCase(value) {
  if (!value) return "Page";
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function GenericPlaceholder({
  title,
  emoji = "✨",
  description,
  backTo = "/",
  backLabel = "Back to Home",
}) {
  const location = useLocation();
  const routeSegment = location.pathname.replace(/^\/+/, "");
  const pageName = title || toTitleCase(routeSegment);

  const pageDescription =
    description ||
    `We're currently building the ${pageName} experience. Stay tuned for a revolutionary way to interact with content on Ziele.`;

  return (
    <div className="placeholder-container" style={containerStyle}>
      {emoji ? (
        <div
          style={{
            fontSize: "4rem",
            marginBottom: "1rem",
            opacity: 0.8,
            color: "var(--text-main)",
          }}
        >
          {emoji}
        </div>
      ) : null}

      <h1 style={titleStyle}>{pageName}</h1>

      <p style={descriptionStyle}>
        {description ? (
          pageDescription
        ) : (
          <>
            We&apos;re currently building the <strong>{pageName}</strong>{" "}
            experience. Stay tuned for a revolutionary way to interact with
            content on Ziele.
          </>
        )}
      </p>

      <Link to={backTo} style={backButtonStyle}>
        {backLabel}
      </Link>
    </div>
  );
}

export default GenericPlaceholder;
