import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userName: string | null;
  login: (email: string, password: string) => Promise<boolean>;
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
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...'); // Debug log
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        console.log('Auth response status:', res.status); // Debug log
        
        const data = await res.json();
        console.log('Auth response data:', data); // Debug log
        
        if (data.user) {
          setIsAuthenticated(true);
          setUserName(data.user.firstName + ' ' + data.user.lastName);
          console.log('User authenticated:', data.user); // Debug log
        } else {
          setIsAuthenticated(false);
          setUserName(null);
          console.log('User not authenticated'); // Debug log
        }
      } catch (e) {
        console.error('Auth check failed:', e);
        setIsAuthenticated(false);
        setUserName(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUserName(data.user.firstName + ' ' + data.user.lastName);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    // call backend to clear cookie
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setIsAuthenticated(false);
    setUserName(null);
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUserName(data.user.firstName + ' ' + data.user.lastName);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userName, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};
