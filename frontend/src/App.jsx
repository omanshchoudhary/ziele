import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./styles/variables.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/common.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Connections from "./pages/Connections";
import TrendingPage from "./pages/TrendingPage";
import Communities from "./pages/Communities";
import GenericPlaceholder from "./pages/GenericPlaceholder";
import Analytics from "./pages/Analytics";
import FloatingPanel from "./components/FloatingPanel";

const THEME_STORAGE_KEY = "ziele-theme";
const THEMES = {
  DARK: "dark",
  LIGHT: "light",
};

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === THEMES.DARK || savedTheme === THEMES.LIGHT) {
      return savedTheme;
    }

    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    )?.matches;
    return prefersDark ? THEMES.DARK : THEMES.LIGHT;
  } catch {
    return THEMES.DARK;
  }
}

function App() {
  const location = useLocation();
  const hideSidebar =
    location.pathname === "/discover" || location.pathname === "/analytics";

  const [theme, setTheme] = React.useState(getInitialTheme);

  const isDarkTheme = theme === THEMES.DARK;

  const toggleTheme = React.useCallback(() => {
    setTheme((currentTheme) =>
      currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK,
    );
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  return (
    <div className="app">
      <FloatingPanel />
      <Navbar
        theme={theme}
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
      />
      <div className={`main-layout${hideSidebar ? " discover-full" : ""}`}>
        <main className="feed-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/drafts" element={<GenericPlaceholder />} />
            <Route path="/bookmarks" element={<GenericPlaceholder />} />
            <Route path="/settings" element={<GenericPlaceholder />} />
            <Route path="/more" element={<GenericPlaceholder />} />
          </Routes>
        </main>
        {!hideSidebar && <Sidebar />}
      </div>
    </div>
  );
}

export default App;
