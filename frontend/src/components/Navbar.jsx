import React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
// IMPORT: Clerk Auth UI components for seamless conditional rendering based on session state
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/clerk-react";
import "./Navbar.css";

const SEARCHABLE_PATHS = ["/", "/discover", "/communities"];

function Navbar({ isDarkTheme = true, onToggleTheme = () => {} }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryFromUrl = params.get("q") || "";

    setSearchQuery((currentQuery) => {
      if (SEARCHABLE_PATHS.includes(location.pathname)) {
        return queryFromUrl;
      }

      if (queryFromUrl && currentQuery !== queryFromUrl) {
        return queryFromUrl;
      }

      return currentQuery;
    });
  }, [location.pathname, location.search]);

  // Resolve which page the search targets:
  // stay on Home / Discover / Communities; default to Discover for other pages.
  const resolveSearchPath = () => {
    if (SEARCHABLE_PATHS.includes(location.pathname)) return location.pathname;
    return "/discover";
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const trimmed = searchQuery.trim();
    const params = new URLSearchParams(location.search);

    if (!trimmed) {
      params.delete("q");
    } else {
      params.set("q", trimmed);
    }

    const nextQuery = params.toString();
    const targetPath = resolveSearchPath();
    navigate(`${targetPath}${nextQuery ? `?${nextQuery}` : ""}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(location.search);
    params.delete("q");
    const nextQuery = params.toString();
    const targetPath = resolveSearchPath();
    navigate(`${targetPath}${nextQuery ? `?${nextQuery}` : ""}`);
  };


  const getNavLinkClass = ({ isActive }) =>
    `nav-btn${isActive ? " active" : ""}`;

  return (
    <nav className="navbar" role="navigation" aria-label="Primary">
      <Link to="/" className="nav-brand" aria-label="Ziele home">
        Ziele
      </Link>

      <form className="nav-search" role="search" onSubmit={handleSearchSubmit}>
        <label htmlFor="navbar-search" className="sr-only">
          Search stories, topics, or authors
        </label>
        <input
          id="navbar-search"
          type="search"
          placeholder="Search stories, topics, or authors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search stories, topics, or authors"
          autoComplete="off"
        />

        {searchQuery ? (
          <button
            type="button"
            className="nav-search-clear"
            onClick={clearSearch}
            aria-label="Clear search"
            title="Clear search"
          >
            ×
          </button>
        ) : null}
      </form>

      <div className="nav-links" aria-label="Main links">
        <button
          type="button"
          className="nav-btn nav-theme-toggle"
          onClick={onToggleTheme}
          title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={
            isDarkTheme ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {isDarkTheme ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"></path>
            </svg>
          )}
          <span>{isDarkTheme ? "Light" : "Dark"}</span>
        </button>

        <NavLink
          to="/"
          end
          className={getNavLinkClass}
          title="Home"
          aria-label="Home"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/discover"
          className={getNavLinkClass}
          title="Discover"
          aria-label="Discover"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
          <span>Discover</span>
        </NavLink>

        {/* CLERK: Only show these action links and the UserButton if the user is authenticated */}
        <SignedIn>
          <NavLink
            to="/create"
            className={({ isActive }) =>
              `nav-btn nav-btn-primary${isActive ? " active" : ""}`
            }
            title="Write a post"
            aria-label="Create post"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span>Post</span>
          </NavLink>

          <NavLink
            to="/notifications"
            className={getNavLinkClass}
            title="Notifications"
            aria-label="Notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
            <span>Notifications</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={getNavLinkClass}
            title="Your profile"
            aria-label="Profile"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Profile</span>
          </NavLink>

          {/* CLERK: Interactive user profile dropdown provided by Clerk SDK */}
          <div className="nav-btn" title="Manage Account">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: { width: 32, height: 32 } } }} />
          </div>
        </SignedIn>

        {/* CLERK: Show the native Sign In modal trigger when the user is logged out */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="nav-btn nav-btn-primary" style={{ cursor: "pointer" }}>
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </nav>
  );
}

export default Navbar;
