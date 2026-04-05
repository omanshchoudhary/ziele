import React from "react";

function containerStyle() {
  return {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f7fb",
    padding: "24px",
    color: "#0f172a",
  };
}

function cardStyle() {
  return {
    maxWidth: "640px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid #e2e8f0",
  };
}

function badgeStyle() {
  return {
    display: "inline-block",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };
}

export function ReminderEmail({
  profileName,
  unreadCount,
  highlights = [],
  appUrl,
}) {
  return React.createElement(
    "div",
    { style: containerStyle() },
    React.createElement(
      "div",
      { style: cardStyle() },
      React.createElement("span", { style: badgeStyle() }, "Ziele reminder"),
      React.createElement(
        "h1",
        { style: { marginTop: "20px", fontSize: "28px", lineHeight: 1.2 } },
        `You have ${unreadCount} new update${unreadCount === 1 ? "" : "s"}, ${profileName}`,
      ),
      React.createElement(
        "p",
        { style: { fontSize: "16px", lineHeight: 1.6, color: "#334155" } },
        "Your readers and network have been active. Here is a quick snapshot so you can jump back in without scanning the entire app.",
      ),
      React.createElement(
        "ul",
        { style: { paddingLeft: "20px", color: "#1e293b", lineHeight: 1.7 } },
        ...highlights.map((item) =>
          React.createElement("li", { key: item }, item),
        ),
      ),
      React.createElement(
        "a",
        {
          href: `${appUrl}/notifications`,
          style: {
            display: "inline-block",
            marginTop: "20px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "12px 18px",
            textDecoration: "none",
            borderRadius: "10px",
            fontWeight: 700,
          },
        },
        "Open your notifications",
      ),
      React.createElement(
        "p",
        {
          style: {
            marginTop: "24px",
            fontSize: "13px",
            color: "#64748b",
            lineHeight: 1.6,
          },
        },
        "This reminder is intended for demo and early-production workflows. If the delivery service is unavailable, the backend logs the failure for later inspection.",
      ),
    ),
  );
}

