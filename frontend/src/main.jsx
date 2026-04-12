import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import ClerkTokenBridge from "./components/ClerkTokenBridge";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function MissingClerkKeyScreen() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: "36rem",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "1.25rem" }}>Clerk configuration required</h1>
      <p style={{ lineHeight: 1.6 }}>
        Add{" "}
        <code style={{ fontSize: "0.9em" }}>VITE_CLERK_PUBLISHABLE_KEY</code>{" "}
        to <code style={{ fontSize: "0.9em" }}>frontend/.env</code> (see{" "}
        <code style={{ fontSize: "0.9em" }}>.env.example</code>), then restart
        the Vite dev server.
      </p>
    </div>
  );
}

export function ClerkProviderWithRouter({ children }) {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/feed"
      signUpFallbackRedirectUrl="/feed"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}

const root = document.getElementById("root");

if (!PUBLISHABLE_KEY) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <MissingClerkKeyScreen />
    </React.StrictMode>,
  );
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <ClerkProviderWithRouter>
          <ClerkTokenBridge />
          <App />
        </ClerkProviderWithRouter>
      </BrowserRouter>
    </React.StrictMode>,
  );
}
