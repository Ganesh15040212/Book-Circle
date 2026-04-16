import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  libraryStatus?: 'unverified' | 'pending' | 'verified';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string, captchaToken: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, captchaToken: string, otpToken: string) => Promise<void>;
  updateLibraryStatus: (status: 'unverified' | 'pending' | 'verified') => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Live update polling for user status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (accessToken && user) {
      interval = setInterval(async () => {
        try {
          const res = await apiFetch('/auth/me.php', {}, accessToken);
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            if (JSON.stringify(user) !== JSON.stringify(data.user)) {
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          }
        } catch (e) {
          // silent fail
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [accessToken, user]);

  const login = async (email: string, password: string, captchaToken: string) => {
    const response = await apiFetch('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password, captchaToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = typeof data.error === 'string' 
        ? data.error 
        : (data.error?.message || JSON.stringify(data.error) || 'Login failed');
      throw new Error(errorMessage);
    }

    setAccessToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    captchaToken: string,
    otpToken: string
  ) => {
    const response = await apiFetch('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, captchaToken, otpToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = typeof data.error === 'string' 
        ? data.error 
        : (data.error?.message || JSON.stringify(data.error) || 'Registration failed');
      throw new Error(errorMessage);
    }

    setAccessToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const updateLibraryStatus = (status: 'unverified' | 'pending' | 'verified') => {
    if (user) {
      const updatedUser = { ...user, libraryStatus: status };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, updateLibraryStatus, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};