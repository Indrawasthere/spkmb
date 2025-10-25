import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  signup: (email: string, password: string, firstName: string, lastName: string) => boolean;
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
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('auth');
    const storedUserName = localStorage.getItem('userName');
    if (auth === 'true') {
      setIsAuthenticated(true);
      setUserName(storedUserName);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    if (email === 'admin@gmail.com' && password === 'qwe123') {
      setIsAuthenticated(true);
      setUserName('Admin');
      localStorage.setItem('auth', 'true');
      localStorage.setItem('userName', 'Admin');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserName(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('userName');
  };

  const signup = (email: string, password: string, firstName: string, lastName: string): boolean => {
    // For demo, just set authenticated
    setIsAuthenticated(true);
    const fullName = `${firstName} ${lastName}`;
    setUserName(fullName);
    localStorage.setItem('auth', 'true');
    localStorage.setItem('userName', fullName);
    return true;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};
