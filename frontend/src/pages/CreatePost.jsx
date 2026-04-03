import React from 'react';

function CreatePost() {
  return (
    <div className="page">
      <h1>Create New Post</h1>
      <form>
        <input type="text" placeholder="Title" />
        <textarea placeholder="Write your post..."></textarea>
        <button type="submit">Publish</button>
      </form>
    </div>
  );
}

export default CreatePost;
