import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  createPost,
  uploadPostMedia,
  validatePostMediaUrl,
} from "../lib/api";
import MediaAttachment from "../components/MediaAttachment";
import "../components/PostCard.css";
import "./CreatePost.css";

const INITIAL_STATE = {
  title: "",
  content: "",
  tagsInput: "",
  mediaInput: "",
  mediaUrl: "",
  mediaType: "",
  mediaSource: "",
  language: "English",
  publishAsPremium: false,
};

function parseTags(rawTags) {
  return rawTags
    .split(/[,\n]/g)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, 8);
}

function estimateReadTime(content) {
  const words = content
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (!words) return "0 min read";
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

function CreatePost() {
  const [form, setForm] = useState(INITIAL_STATE);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [publishedPost, setPublishedPost] = useState(null);
  const [error, setError] = useState("");
  const [mediaMessage, setMediaMessage] = useState("");
  const fileInputRef = useRef(null);

  const tags = useMemo(() => parseTags(form.tagsInput), [form.tagsInput]);
  const readTime = useMemo(() => estimateReadTime(form.content), [form.content]);

  const onChange = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyMediaSelection = (media) => {
    setForm((prev) => ({
      ...prev,
      mediaUrl: media.url,
      mediaType: media.mediaType,
      mediaSource: media.mediaSource,
      mediaInput: media.url,
    }));
  };

  const clearMedia = () => {
    setForm((prev) => ({
      ...prev,
      mediaInput: "",
      mediaUrl: "",
      mediaType: "",
      mediaSource: "",
    }));
    setMediaMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleValidateMediaUrl = async (rawValue = form.mediaInput) => {
    const mediaInput = String(rawValue || "").trim();

    if (!mediaInput) {
      clearMedia();
      return null;
    }

    setIsValidatingUrl(true);
    setError("");

    try {
      const media = await validatePostMediaUrl({ mediaUrl: mediaInput });
      applyMediaSelection(media);
      setMediaMessage(`Validated ${media.mediaType} URL.`);
      return media;
    } catch (validationError) {
      setMediaMessage("");
      throw validationError;
    } finally {
      setIsValidatingUrl(false);
    }
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setIsUploadingMedia(true);
    setError("");

    try {
      const media = await uploadPostMedia(selectedFile);
      applyMediaSelection(media);
      setMediaMessage(`Uploaded ${media.mediaType} to Cloudinary.`);
    } catch (uploadError) {
      setMediaMessage("");
      setError(uploadError.message || "Unable to upload media.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.content.replace(/<[^>]*>/g, " ").trim()) {
      window.alert("Please add both title and content before publishing.");
      return;
    }

    setIsPublishing(true);
    setError("");

    try {
      let mediaPayload = null;
      const pendingMediaUrl = form.mediaInput.trim();

      // We validate pasted URLs here as a final guard so the saved post only stores vetted media.
      if (pendingMediaUrl) {
        const needsValidation =
          form.mediaSource !== "upload" || form.mediaUrl !== pendingMediaUrl;

        mediaPayload = needsValidation
          ? await handleValidateMediaUrl(pendingMediaUrl)
          : {
              url: form.mediaUrl,
              mediaType: form.mediaType,
              mediaSource: form.mediaSource,
            };
      }

      const newPost = await createPost({
        title: form.title.trim(),
        content: form.content.trim(),
        tags,
        mediaUrl: mediaPayload?.url || "",
        mediaType: mediaPayload?.mediaType || "",
        mediaSource: mediaPayload?.mediaSource || "",
        language: form.language,
        premium: form.publishAsPremium,
      });

      setPublishedPost(newPost);
      setForm(INITIAL_STATE);
      setMediaMessage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (publishError) {
      setError(publishError.message || "Unable to publish your post.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="page create-post-page">
      <header className="create-post-header">
        <h1 className="create-post-title">Create New Post</h1>
        <Link to="/" className="back-btn">
          â† Back to Home
        </Link>
      </header>

      <form onSubmit={onSubmit} className="create-post-form">
        <input
          type="text"
          placeholder="Post title"
          value={form.title}
          onChange={onChange("title")}
          maxLength={120}
          required
        />

        <ReactQuill
          theme="snow"
          value={form.content}
          onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
          modules={quillModules}
          placeholder="Write your post..."
        />

        <input
          type="text"
          placeholder="Tags (comma separated) e.g. React, Design, Productivity"
          value={form.tagsInput}
          onChange={onChange("tagsInput")}
        />

        <div className="create-post-media-grid">
          <label className="create-post-upload-label">
            <span className="create-post-label-text">Upload image or video</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
          </label>

          <div className="create-post-url-row">
            <input
              type="url"
              placeholder="Paste a direct image/video URL"
              value={form.mediaInput}
              onChange={onChange("mediaInput")}
            />
            <button
              type="button"
              className="create-post-secondary-btn"
              onClick={() => handleValidateMediaUrl().catch((validationError) => {
                setError(validationError.message || "Invalid media URL.");
              })}
              disabled={isValidatingUrl}
            >
              {isValidatingUrl ? "Checking..." : "Validate URL"}
            </button>
            {(form.mediaUrl || form.mediaInput) && (
              <button
                type="button"
                className="create-post-secondary-btn"
                onClick={clearMedia}
              >
                Clear media
              </button>
            )}
          </div>
        </div>

        <div className="create-post-options-row">
          <label className="create-post-select-label">
            <span className="create-post-label-text">Language</span>
            <select
              value={form.language}
              onChange={onChange("language")}
              className="create-post-select"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
            </select>
          </label>

          <label className="create-post-checkbox-label">
            <input
              type="checkbox"
              checked={form.publishAsPremium}
              onChange={onChange("publishAsPremium")}
            />
            Mark as premium post
          </label>
        </div>

        <div className="create-post-meta-row">
          <span>{form.title.length}/120 characters</span>
          <span>{readTime}</span>
          <span>
            {isUploadingMedia
              ? "Uploading media..."
              : mediaMessage || "No media attached"}
          </span>
        </div>

        {tags.length > 0 && (
          <div className="post-tags-container">
            {tags.map((tag) => (
              <span key={tag} className="post-tag-pill">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {error ? <p>{error}</p> : null}

        <button type="submit" disabled={isPublishing || isUploadingMedia}>
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
      </form>

      <section className="create-post-preview-section">
        <h2 className="create-post-preview-title">Live Preview</h2>
        <article className="post-card">
          <div className="post-body-mid">
            <h3 className="post-title">
              {form.title.trim() || "Your title will appear here"}
            </h3>

            <MediaAttachment
              mediaUrl={form.mediaUrl}
              mediaType={form.mediaType}
              alt={form.title.trim() || "Media preview"}
              className="post-media-shell"
            />

            <div
              className="post-content"
              dangerouslySetInnerHTML={{
                __html:
                  form.content.trim() ||
                  "<p>Start writing your content to see a preview.</p>",
              }}
            />
            <div className="post-tags-container">
              {tags.map((tag) => (
                <span key={tag} className="post-tag-pill">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      </section>

      {publishedPost && (
        <section className="create-post-success">
          Published: <strong>{publishedPost.title}</strong> (
          {publishedPost.readTime})
        </section>
      )}
    </div>
  );
}

export default CreatePost;
