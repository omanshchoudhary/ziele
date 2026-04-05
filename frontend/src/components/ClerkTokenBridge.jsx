import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { setAuthTokenGetter } from "../lib/api";

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

export default ClerkTokenBridge;
