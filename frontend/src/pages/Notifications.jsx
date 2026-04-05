import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./Notifications.css";
import {
  connectNotificationsSocket,
  getCurrentProfile,
  getNotifications as getNotificationsApi,
} from "../lib/apiClient";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [socketStatus, setSocketStatus] = useState("connecting");

  const unreadCount = useMemo(
    () => notifications.filter((notif) => !notif.read).length,
    [notifications],
  );

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Just now";

    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getIcon = (type) => {
    switch (type) {
      case "follow":
        return (
          <div className="icon-follow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
          </div>
        );
      case "like":
        return (
          <div className="icon-like">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
        );
      case "comment":
        return (
          <div className="icon-comment">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        );
      case "dislike":
        return (
          <div className="icon-comment">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m10 14 2-2 2 2"></path>
              <path d="m14 10-2 2-2-2"></path>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getMessage = (notif) => {
    switch (notif.type) {
      case "follow":
        return (
          <span>
            <strong>{notif.user?.name || "Someone"}</strong> started following
            you
          </span>
        );
      case "like":
        return (
          <span>
            <strong>{notif.user?.name || "Someone"}</strong> liked your story{" "}
            {notif.target ? (
              <span className="notification-target">{notif.target}</span>
            ) : null}
          </span>
        );
      case "comment":
        return (
          <span>
            <strong>{notif.user?.name || "Someone"}</strong> commented on{" "}
            {notif.target ? (
              <span className="notification-target">{notif.target}</span>
            ) : (
              "your post"
            )}
          </span>
        );
      case "dislike":
        return (
          <span>
            <strong>{notif.user?.name || "Someone"}</strong> disliked your story{" "}
            {notif.target ? (
              <span className="notification-target">{notif.target}</span>
            ) : null}
          </span>
        );
      default:
        return <span>You have a new notification</span>;
    }
  };

  const normalizeNotification = (notif, index) => ({
    id: notif?.id ?? `fallback-${index}`,
    type: notif?.type || "follow",
    user: {
      name: notif?.user?.name || "Ziele User",
      avatar: notif?.user?.avatar || "ZU",
    },
    target: notif?.target || "",
    content: notif?.content || "",
    timestamp: notif?.timestamp || new Date().toISOString(),
    read: Boolean(notif?.read),
  });

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);

    setError("");

    try {
      const data = await getNotificationsApi();
      const safeData = Array.isArray(data)
        ? data.map((notif, idx) => normalizeNotification(notif, idx))
        : [];

      setNotifications(safeData);
    } catch (err) {
      setNotifications([]);
      setError(err.message || "Unable to reach live notifications.");
    } finally {
      if (silent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    // The page subscribes to the current profile room so new notifications
    // appear instantly without waiting for a manual refresh.
    getCurrentProfile()
      .then((profile) => {
        if (cancelled || !profile?.id) {
          setSocketStatus("idle");
          return;
        }

        cleanup = connectNotificationsSocket({
          profileId: profile.id,
          onConnect: () => setSocketStatus("live"),
          onDisconnect: () => setSocketStatus("offline"),
          onError: () => setSocketStatus("offline"),
          onNotification: (payload) => {
            setNotifications((current) => [
              normalizeNotification(payload, Date.now()),
              ...current,
            ]);
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setSocketStatus("offline");
        }
      });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const markOneAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="notifications-container">
          <div className="notifications-header">
            <h1>Notifications</h1>
          </div>

          <div className="loading-state" aria-busy="true" aria-live="polite">
            <p>Loading your updates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="notifications-container">
        <div className="notifications-header">
          <h1>Notifications</h1>

          <div className="notifications-actions">
            {unreadCount > 0 ? (
              <span className="status-chip status-chip--unread">
                {unreadCount} unread
              </span>
            ) : null}
            <span className="status-chip">
              {socketStatus === "live"
                ? "Live"
                : socketStatus === "connecting"
                  ? "Connecting"
                  : "Offline"}
            </span>

            <button
              className="mark-read-btn notifications-refresh-btn"
              onClick={() => loadNotifications({ silent: true })}
              disabled={isRefreshing}
              type="button"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>

            {notifications.length > 0 && unreadCount > 0 ? (
              <button
                className="mark-read-btn notifications-mark-all-btn"
                onClick={markAllAsRead}
                type="button"
              >
                Mark all as read
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="notifications-alert notifications-alert--warning">
            {error}
          </div>
        ) : null}

        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-icon">🔔</div>
            <h3>All caught up!</h3>
            <p>No new notifications at the moment.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notif, index) => (
              <div
                key={notif.id}
                className={`notification-item ${notif.read ? "" : "unread"}`}
                style={{ animationDelay: `${index * 0.08}s` }}
                onClick={() => markOneAsRead(notif.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    markOneAsRead(notif.id);
                  }
                }}
              >
                <img
                  src={
                    typeof notif.user.avatar === "string" &&
                    /^https?:\/\//i.test(notif.user.avatar)
                      ? notif.user.avatar
                      : `https://i.pravatar.cc/150?u=${encodeURIComponent(
                          notif.user.name,
                        )}`
                  }
                  alt={notif.user.name}
                  className="notification-avatar"
                />

                <div className="notification-content">
                  <div className="notification-message">
                    {getMessage(notif)}
                  </div>
                  <div className="notification-time">
                    {formatDate(notif.timestamp)}
                  </div>

                  {notif.type === "comment" && notif.content ? (
                    <div className="notification-comment-preview">
                      "{notif.content}"
                    </div>
                  ) : null}
                </div>

                <div className="notification-icon">{getIcon(notif.type)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
