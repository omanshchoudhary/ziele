import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/common.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Discover from './pages/Discover';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import FloatingPanel from './components/FloatingPanel';

function App() {
  return (
    <div className="app">
      <FloatingPanel />
      <Navbar />
      <div className="main-layout">
        <main className="feed-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
          </Routes>
        </main>
        <Sidebar />
      </div>
    </div>
  );
}

export default App;