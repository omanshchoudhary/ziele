import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';

function Home() {
  return (
    <div className="page">
      <h1>Welcome to InkFlow</h1>
      <p>A simple blogging platform</p>
    </div>
  );
}

function PostDetail() {
  return (
    <div className="page">
      <h1>Post Detail</h1>
      <p>Post content goes here...</p>
    </div>
  );
}

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

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="nav-brand">InkFlow</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/create">Write</Link>
        </div>
      </nav>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/create" element={<CreatePost />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;