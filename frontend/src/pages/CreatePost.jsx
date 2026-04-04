import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../components/PostCard.css";
import "./CreatePost.css";

const INITIAL_STATE = {
  title: "",
  content: "",
  tagsInput: "",
  coverUrl: "",
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
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return "0 min read";
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function CreatePost() {
  const [form, setForm] = useState(INITIAL_STATE);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedPost, setPublishedPost] = useState(null);

  const tags = useMemo(() => parseTags(form.tagsInput), [form.tagsInput]);
  const readTime = useMemo(
    () => estimateReadTime(form.content),
    [form.content],
  );

  const onChange = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      window.alert("Please add both title and content before publishing.");
      return;
    }

    setIsPublishing(true);

    await new Promise((resolve) => setTimeout(resolve, 900));

    const newPost = {
      id: Date.now(),
      title: form.title.trim(),
      content: form.content.trim(),
      tags,
      coverUrl: form.coverUrl.trim(),
      language: form.language,
      readTime,
      premium: form.publishAsPremium,
      createdAt: new Date().toISOString(),
    };

    setPublishedPost(newPost);
    setIsPublishing(false);
    setForm(INITIAL_STATE);
  };

  return (
    <div className="page create-post-page">
      <header className="create-post-header">
        <h1 className="create-post-title">Create New Post</h1>
        <Link to="/" className="back-btn">
          ← Back to Home
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

        <textarea
          placeholder="Write your post..."
          value={form.content}
          onChange={onChange("content")}
          rows={10}
          required
        />

        <input
          type="text"
          placeholder="Tags (comma separated) e.g. React, Design, Productivity"
          value={form.tagsInput}
          onChange={onChange("tagsInput")}
        />

        <input
          type="url"
          placeholder="Cover image URL (optional)"
          value={form.coverUrl}
          onChange={onChange("coverUrl")}
        />

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

        <button type="submit" disabled={isPublishing}>
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
            <p className="post-content">
              {form.content.trim() ||
                "Start writing your content to see a preview."}
            </p>
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
