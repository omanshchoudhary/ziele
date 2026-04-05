import React from "react";
import { getSafeMediaDescriptor } from "../lib/media";

function MediaAttachment({
  mediaUrl,
  mediaType,
  alt = "Post media",
  className = "",
}) {
  const media = getSafeMediaDescriptor(mediaUrl, mediaType);

  if (!media) {
    return null;
  }

  if (media.type === "video") {
    return (
      <div className={className}>
        <video
          className="media-attachment-video"
          src={media.url}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
        >
          Your browser does not support embedded video playback.
        </video>
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        className="media-attachment-image"
        src={media.url}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default MediaAttachment;
