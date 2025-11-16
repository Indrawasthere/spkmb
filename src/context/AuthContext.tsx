import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Sentry from "@sentry/react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER' | 'AUDITOR' | 'MANAGER';
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  userName: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // ========================
  // CHECK AUTH (ON APP LOAD)
  // ========================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (data?.user) {
          setIsAuthenticated(true);
          setUser(data.user);
          setUserName(`${data.user.firstName} ${data.user.lastName}`);

          // Add user context to Sentry
          Sentry.setUser({
            id: data.user.id,
            email: data.user.email,
            username: `${data.user.firstName} ${data.user.lastName}`,
            role: data.user.role,
          });
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setUserName(null);
          Sentry.setUser(null);
        }
      } catch (e) {
        Sentry.captureException(e, {
          tags: { module: "AuthContext", action: "checkAuth" },
        });
        setIsAuthenticated(false);
        setUser(null);
        setUserName(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ========================
  // IDLE TIMEOUT LOGIC
  // ========================
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const IDLE_TIMEOUT = 15 * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        Sentry.captureMessage("User logged out due to inactivity", {
          level: "info",
        });
        logout();
      }, IDLE_TIMEOUT);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    const handleActivity = () => resetTimer();

    if (isAuthenticated) {
      events.forEach((ev) => document.addEventListener(ev, handleActivity, true));
      resetTimer();
    }

    return () => {
      events.forEach((ev) =>
        document.removeEventListener(ev, handleActivity, true)
      );
      clearTimeout(idleTimer);
    };
  }, [isAuthenticated]);

  // ========================
  // LOGIN
  // ========================
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUser(data.user);
        setUserName(`${data.user.firstName} ${data.user.lastName}`);

        Sentry.setUser({
          id: data.user.id,
          email: data.user.email,
          username: `${data.user.firstName} ${data.user.lastName}`,
          role: data.user.role,
        });

        Sentry.captureMessage("User logged in successfully", {
          level: "info",
          extra: { email },
        });

        return true;
      }

      Sentry.captureMessage("Login failed", {
        level: "warning",
        extra: { email, responseStatus: response.status },
      });

      return false;
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { module: "AuthContext", action: "login" },
        extra: { email },
      });
      return false;
    }
  };

  // ========================
  // LOGOUT
  // ========================
  const logout = () => {
    fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});

    Sentry.captureMessage("User logged out", { level: "info" });
    Sentry.setUser(null);

    setIsAuthenticated(false);
    setUser(null);
    setUserName(null);
  };

  // ========================
  // SIGNUP
  // ========================
  const signup = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUser(data.user);
        setUserName(`${data.user.firstName} ${data.user.lastName}`);

        Sentry.setUser({
          id: data.user.id,
          email: data.user.email,
          username: `${data.user.firstName} ${data.user.lastName}`,
          role: data.user.role,
        });

        Sentry.captureMessage("User registered successfully", {
          level: "info",
          extra: { email },
        });

        return true;
      }

      Sentry.captureMessage("Signup failed", {
        level: "warning",
        extra: { email, status: response.status },
      });

      return false;
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { module: "AuthContext", action: "signup" },
        extra: { email },
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        userName,
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
