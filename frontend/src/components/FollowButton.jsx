import React from "react";
import { followProfile, unfollowProfile } from "../lib/api";

function FollowButton({
  profileId,
  profileName = "creator",
  initialIsFollowing = false,
  isOwnProfile = false,
  className = "follow-btn",
  onChange = null,
}) {
  const [isFollowing, setIsFollowing] = React.useState(Boolean(initialIsFollowing));
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setIsFollowing(Boolean(initialIsFollowing));
  }, [initialIsFollowing]);

  if (!profileId || isOwnProfile) {
    return null;
  }

  const handleClick = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = isFollowing
        ? await unfollowProfile(profileId)
        : await followProfile(profileId);

      setIsFollowing(Boolean(response?.isFollowing));
      onChange?.(response);
    } catch (error) {
      const message = error.message || `Unable to update ${profileName}.`;

      if (/unauthorized/i.test(message)) {
        window.alert("Please sign in to follow creators.");
      } else {
        window.alert(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={isSubmitting}
      aria-pressed={isFollowing}
      aria-label={`${isFollowing ? "Unfollow" : "Follow"} ${profileName}`}
    >
      {isSubmitting ? "Saving..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}

export default FollowButton;
