import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCurrentProfile, getProfile } from "../lib/apiClient";
import FollowButton from "../components/FollowButton";
import { formatCompactNumber } from "../lib/formatters";
import "./Connections.css";

function Connections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const profileId = searchParams.get("profile");
  const tab = searchParams.get("tab") === "following" ? "following" : "followers";

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    const request = profileId ? getProfile(profileId) : getCurrentProfile();

    request
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError.message || "Unable to load connections.");
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
  }, [profileId]);

  const activeList =
    tab === "following" ? profile?.followingList || [] : profile?.followersList || [];

  const setTab = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    if (profile?.id) {
      next.set("profile", profile.id);
    }
    setSearchParams(next);
  };

  if (isLoading) {
    return (
      <div className="page connections-page">
        <h1>Connections</h1>
        <p>Loading your network...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page connections-page">
        <h1>Connections</h1>
        <p>{error || "We couldn’t find that profile."}</p>
        <Link to="/profile" className="back-btn">
          Back to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="page connections-page">
      <div className="connections-header">
        <div>
          <h1>Connections</h1>
          <p className="connections-subtitle">
            Explore {profile.name}&rsquo;s network and follow people directly from
            one place.
          </p>
        </div>
        <Link
          to={`/profile/${encodeURIComponent(profile.id)}`}
          className="back-btn"
        >
          View Profile
        </Link>
      </div>

      <div className="connections-summary">
        <div className="connections-owner">
          <div className="connections-owner-avatar">{profile.avatar}</div>
          <div>
            <p className="connections-owner-name">{profile.name}</p>
            <p className="connections-owner-handle">{profile.handle}</p>
          </div>
        </div>

        <div className="connections-counts">
          <button
            type="button"
            className={`connections-tab ${tab === "followers" ? "active" : ""}`}
            onClick={() => setTab("followers")}
          >
            {formatCompactNumber(profile.followers)} Followers
          </button>
          <button
            type="button"
            className={`connections-tab ${tab === "following" ? "active" : ""}`}
            onClick={() => setTab("following")}
          >
            {formatCompactNumber(profile.following)} Following
          </button>
        </div>
      </div>

      {activeList.length === 0 ? (
        <div className="connections-empty">
          <p>
            No {tab} to show yet.
          </p>
        </div>
      ) : (
        <div className="connections-list">
          {activeList.map((connection) => (
            <article key={connection.id} className="connections-card">
              <Link
                to={`/profile/${encodeURIComponent(connection.id)}`}
                className="connections-card-avatar"
              >
                {connection.avatar}
              </Link>

              <div className="connections-card-body">
                <div className="connections-card-header">
                  <div>
                    <Link
                      to={`/profile/${encodeURIComponent(connection.id)}`}
                      className="connections-card-name"
                    >
                      {connection.name}
                    </Link>
                    <p className="connections-card-handle">{connection.handle}</p>
                  </div>
                  <FollowButton
                    profileId={connection.id}
                    profileName={connection.name}
                    initialIsFollowing={connection.isFollowing}
                    isOwnProfile={connection.isOwnProfile}
                    className="follow-btn"
                  />
                </div>

                <p className="connections-card-bio">{connection.bio}</p>

                <div className="connections-card-meta">
                  <span>{formatCompactNumber(connection.followers)} followers</span>
                  <span>{formatCompactNumber(connection.postsCount)} posts</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Connections;
