import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// IMPORT: Clerk SDK to wrap our application with authentication context
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import App from './App';
import { setAuthTokenGetter } from './lib/api';
import './index.css';

// AUTH CONFIG: Retrieve the Clerk publishable key from Vite's environment variables.
// You must add VITE_CLERK_PUBLISHABLE_KEY to your frontend/.env file.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error("Missing Clerk Publishable Key in .env! Auth will fail.");
  // We don't throw a hard hard error to let the UI render something, but Clerk needs a key.
  // Using a dummy key here temporarily to prevent fatal crashes if env isn't populated yet.
}

const safeKey = PUBLISHABLE_KEY || 'pk_test_ZHVtbXkta2V5LmNsZXJrLmFjY291bnRzLmRldiQ';

function ClerkTokenBridge() {
  const { getToken } = useAuth();

  React.useEffect(() => {
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });

    return () => {
      setAuthTokenGetter(null);
    };
  }, [getToken]);

  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* PROVIDER: ClerkProvider injects auth state to all child components. */}
    <ClerkProvider publishableKey={safeKey} afterSignOutUrl="/">
      <ClerkTokenBridge />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
