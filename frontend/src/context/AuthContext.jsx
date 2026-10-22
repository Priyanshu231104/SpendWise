
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { apiRequest, configureApiAuth } from "../services/api.js";
import { AuthContext } from "./AuthContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Keep the latest access token available immediately to API requests.
  const accessTokenRef = useRef(null);

  // Prevent concurrent refresh requests from rotating the same cookie.
  const refreshPromiseRef = useRef(null);

  // Update the ref and React state together.
  const updateAccessToken = useCallback((token) => {
    accessTokenRef.current = token;
    setAccessToken(token);
  }, []);

  const getToken = useCallback(() => accessTokenRef.current, []);

  // Refresh the access token using the HttpOnly refresh cookie.
  const refresh = useCallback(() => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshRequest = (async () => {
      try {
        const result = await apiRequest("/auth/refresh", {
          method: "POST",
        });

        const newAccessToken = result.data.accessToken;

        if (!newAccessToken) {
          throw new Error("The server did not return an access token.");
        }

        updateAccessToken(newAccessToken);
        return newAccessToken;
      } catch {
        updateAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    })();

    refreshPromiseRef.current = refreshRequest;

    refreshRequest.then(
      () => {
        if (refreshPromiseRef.current === refreshRequest) {
          refreshPromiseRef.current = null;
        }
      },
      () => {
        if (refreshPromiseRef.current === refreshRequest) {
          refreshPromiseRef.current = null;
        }
      },
    );

    return refreshRequest;
  }, [updateAccessToken]);

  // Configure the API client before session restoration starts.
  useEffect(() => {
    configureApiAuth({
      getToken,
      refresh,
    });
  }, [getToken, refresh]);

  // Restore the authenticated session when the app loads.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const newAccessToken = await refresh();

        if (!newAccessToken || cancelled) {
          return;
        }

        const result = await apiRequest("/users/me", {
          method: "GET",
        });

        if (cancelled) {
          return;
        }

        setUser(result.data.user);
        setIsAuthenticated(true);
      } catch {
        if (!cancelled) {
          setUser(null);
          updateAccessToken(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [refresh, updateAccessToken]);

  const login = useCallback(
    async ({ email, password }) => {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const newAccessToken = result.data.accessToken;
      const loggedInUser = result.data.user;

      if (!newAccessToken || !loggedInUser) {
        throw new Error("The server returned an incomplete login response.");
      }

      updateAccessToken(newAccessToken);
      setUser(loggedInUser);
      setIsAuthenticated(true);

      return loggedInUser;
    },
    [updateAccessToken],
  );

  const register = useCallback(async ({ name, email, password }) => {
    const result = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    return result.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });
    } finally {
      setUser(null);
      updateAccessToken(null);
      setIsAuthenticated(false);
    }
  }, [updateAccessToken]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated,
      isAuthLoading,
      login,
      register,
      logout,
    }),
    [
      user,
      accessToken,
      isAuthenticated,
      isAuthLoading,
      login,
      register,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
