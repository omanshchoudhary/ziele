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
import TrendingPage from "./pages/TrendingPageReal";
import Communities from "./pages/CommunitiesReal";
import BookmarksPage from "./pages/BookmarksPageReal";
import DraftsPage from "./pages/DraftsPage";
import SettingsPage from "./pages/SettingsPage";
import GenericPlaceholder from "./pages/GenericPlaceholder";
import Analytics from "./pages/AnalyticsReal";
import LandingPage from "./pages/LandingPage";
import FloatingPanel from "./components/FloatingPanel";

// IMPORT: Clerk Auth helper components to handle route protection
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

// HELPER: Component to protect specific private routes
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
};

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
  const isLandingPage = location.pathname === "/";
  const hideSidebar = [
    "/discover",
    "/analytics",
    "/settings",
    "/drafts",
    "/bookmarks",
    "/trending",
    "/create",
  ].includes(location.pathname);

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

  if (isLandingPage) {
    return (
      <div className="app">
        <LandingPage
          isDarkTheme={isDarkTheme}
          onToggleTheme={toggleTheme}
        />
      </div>
    );
  }

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
            {/* PUBLIC ROUTES: Accessible to everyone */}
            <Route path="/feed" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/post/:id/:slug?" element={<PostDetail />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/communities" element={<Communities />} />
            {/* PRIVATE ROUTES: Require user authentication via Clerk */}
            <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />

            {/* FULL PAGES */}
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
            <Route path="/drafts" element={<DraftsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/more" element={<GenericPlaceholder />} />
          </Routes>
        </main>
        {!hideSidebar && <Sidebar />}
      </div>
    </div>
  );
}

export default App;
