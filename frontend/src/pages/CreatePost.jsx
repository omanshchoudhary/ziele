import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  createPost,
  factCheckPostContent,
  getPosts,
  uploadPostMedia,
  validatePostMediaUrl,
} from "../lib/apiClient";
import MediaAttachment from "../components/MediaAttachment";
import "../components/PostCard.css";
import "./CreatePost.css";

const DEFAULT_TAG_OPTIONS = [
  "Technology",
  "React",
  "Design",
  "Writing",
  "Productivity",
  "Community",
  "AI",
  "Startup",
  "JavaScript",
  "UI/UX",
  "Trends",
  "Storytelling",
];

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
  return String(rawTags || "")
    .split(/[,\n]/g)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, 8);
}

function mergeTags(...tagGroups) {
  const next = [];
  const seen = new Set();

  tagGroups.flat().forEach((tag) => {
    const normalized = String(tag || "").trim().replace(/^#/, "");
    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    next.push(normalized);
  });

  return next.slice(0, 8);
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadTime(content) {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
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
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState(DEFAULT_TAG_OPTIONS);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [isCheckingModeration, setIsCheckingModeration] = useState(false);
  const [publishedPost, setPublishedPost] = useState(null);
  const [moderationResult, setModerationResult] = useState(null);
  const [error, setError] = useState("");
  const [mediaMessage, setMediaMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef(null);

  const customTags = useMemo(() => parseTags(form.tagsInput), [form.tagsInput]);
  const tags = useMemo(
    () => mergeTags(selectedTags, customTags),
    [selectedTags, customTags],
  );
  const plainTextContent = useMemo(() => stripHtml(form.content), [form.content]);
  const readTime = useMemo(() => estimateReadTime(form.content), [form.content]);
  const wordCount = useMemo(
    () => (plainTextContent ? plainTextContent.split(/\s+/).filter(Boolean).length : 0),
    [plainTextContent],
  );

  useEffect(() => {
    let cancelled = false;

    getPosts()
      .then((posts) => {
        if (cancelled || !Array.isArray(posts)) return;

        const discoveredTags = posts.flatMap((post) => post.tags || []);
        setAvailableTags(mergeTags(DEFAULT_TAG_OPTIONS, discoveredTags));
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableTags(DEFAULT_TAG_OPTIONS);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setModerationResult(null);
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
    setSelectedFileName("");
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
      setSelectedFileName("");
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

    setSelectedFileName(selectedFile.name);
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

  const toggleTag = (tag) => {
    setSelectedTags((current) => {
      const exists = current.some(
        (item) => item.toLowerCase() === String(tag).toLowerCase(),
      );

      if (exists) {
        return current.filter(
          (item) => item.toLowerCase() !== String(tag).toLowerCase(),
        );
      }

      return mergeTags(current, [tag]);
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !stripHtml(form.content)) {
      window.alert("Please add both title and content before publishing.");
      return;
    }

    setIsPublishing(true);
    setError("");

    try {
      let mediaPayload = null;
      const pendingMediaUrl = form.mediaInput.trim();

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
      setSelectedTags([]);
      setModerationResult(null);
      setMediaMessage("");
      setSelectedFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (publishError) {
      setError(publishError.message || "Unable to publish your post.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleModerationCheck = async () => {
    setIsCheckingModeration(true);
    setError("");

    try {
      const result = await factCheckPostContent({
        title: form.title,
        text: form.content,
        tags,
      });
      setModerationResult(result);
    } catch (moderationError) {
      setError(moderationError.message || "Unable to review this draft.");
    } finally {
      setIsCheckingModeration(false);
    }
  };

  return (
    <div className="page create-post-page">
      <header className="create-post-header">
        <div className="create-post-header-copy">
          <span className="create-post-eyebrow">Compose</span>
          <h1 className="create-post-title">Create New Post</h1>
          <p className="create-post-subtitle">
            Write the story, style the description, attach media, and tag it so
            it surfaces cleanly across the product.
          </p>
        </div>
        <Link to="/" className="back-btn">
          Back to Home
        </Link>
      </header>

      <form onSubmit={onSubmit} className="create-post-form">
        <section className="create-post-compose-shell">
          <div className="create-post-section-head">
            <div>
              <p className="create-post-section-kicker">Story draft</p>
              <h2>Headline and description</h2>
              <p>
                Shape the post description in a cleaner writing surface so the
                draft feels closer to the final published card.
              </p>
            </div>
            <div className="create-post-draft-stats">
              <span>{form.title.length}/120</span>
              <span>{wordCount} words</span>
              <span>{readTime}</span>
            </div>
          </div>

          <input
            type="text"
            placeholder="Post title"
            value={form.title}
            onChange={onChange("title")}
            maxLength={120}
            required
          />

          <div className="create-post-editor-shell">
            <div className="create-post-editor-topbar">
              <span className="create-post-label-text">Description</span>
              <span className="create-post-editor-hint">
                Rich formatting is supported and the feed summary will stay clean.
              </span>
            </div>

            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
              modules={quillModules}
              placeholder="Write your post..."
            />
          </div>
        </section>

        <section className="create-post-tag-shell">
          <div className="create-post-section-head">
            <div>
              <p className="create-post-section-kicker">Discover tags</p>
              <h2>Select multiple tags</h2>
              <p>
                The selected tags become the post chips and also help the blog
                appear in Discover.
              </p>
            </div>
          </div>

          <div className="create-post-tag-grid">
            {availableTags.map((tag) => {
              const isActive = tags.some(
                (selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase(),
              );

              return (
                <button
                  key={tag}
                  type="button"
                  className={`create-post-tag-option${isActive ? " active" : ""}`}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={isActive}
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Add extra custom tags, comma separated"
            value={form.tagsInput}
            onChange={onChange("tagsInput")}
          />
        </section>

        <section className="create-post-media-shell">
          <div className="create-post-section-head">
            <div>
              <p className="create-post-section-kicker">Media</p>
              <h2>Upload or attach a file</h2>
              <p>
                Use a local image or video, or paste a direct media URL and
                validate it before publish.
              </p>
            </div>
          </div>

          <div className="create-post-media-grid">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="create-post-file-input"
            />

            <div className="create-post-file-picker">
              <button
                type="button"
                className="create-post-file-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploadingMedia ? "Uploading..." : "Choose file"}
              </button>
              <div className="create-post-file-meta">
                <strong>{selectedFileName || "No local file selected"}</strong>
                <span>Images and videos supported</span>
              </div>
            </div>

            <div className="create-post-url-row">
              <input
                type="url"
                placeholder="Paste a direct image/video URL"
                value={form.mediaInput}
                onChange={onChange("mediaInput")}
              />
              <div className="create-post-inline-actions">
                <button
                  type="button"
                  className="create-post-secondary-btn"
                  onClick={() =>
                    handleValidateMediaUrl().catch((validationError) => {
                      setError(validationError.message || "Invalid media URL.");
                    })
                  }
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
          </div>
        </section>

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
          <span>{tags.length} tags selected</span>
          <span>
            {isUploadingMedia
              ? "Uploading media..."
              : mediaMessage || "No media attached"}
          </span>
        </div>

        <div className="create-post-options-row">
          <button
            type="button"
            className="create-post-secondary-btn"
            onClick={handleModerationCheck}
            disabled={isCheckingModeration}
          >
            {isCheckingModeration ? "Reviewing..." : "Run AI fact-check"}
          </button>
          <span className="create-post-label-text">
            Uses rules first, then Gemini when available.
          </span>
        </div>

        {moderationResult ? (
          <section
            className="create-post-preview-section"
            style={{ marginTop: "0.5rem" }}
          >
            <h2 className="create-post-preview-title">Moderation hints</h2>
            <div className="post-tags-container">
              <span className="post-tag-pill">{moderationResult.label}</span>
              <span className="post-tag-pill">
                Confidence {Math.round((moderationResult.confidence || 0) * 100)}%
              </span>
              {moderationResult.fallbackUsed ? (
                <span className="post-tag-pill">Fallback</span>
              ) : null}
            </div>
            <p>{moderationResult.summary}</p>
            <p style={{ opacity: 0.8 }}>{moderationResult.factCheck}</p>
            <p style={{ opacity: 0.8 }}>{moderationResult.message}</p>
            {moderationResult.flags?.length ? (
              <div className="post-tags-container">
                {moderationResult.flags.map((flag) => (
                  <span key={flag.code} className="post-tag-pill">
                    {flag.label} ({flag.severity})
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ opacity: 0.8 }}>
                No extra warning flags were raised for this draft.
              </p>
            )}
          </section>
        ) : null}

        {tags.length > 0 && (
          <div className="post-tags-container create-post-selected-tags">
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
        <article className="post-card create-post-preview-card">
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
          Published: <strong>{publishedPost.title}</strong> ({publishedPost.readTime})
        </section>
      )}
    </div>
  );
}

export default CreatePost;
