import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cybermesh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('cybermesh_token');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('cybermesh_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out');
          logout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.login({ username, password });
    if (res.success && res.data.token) {
      localStorage.setItem('cybermesh_token', res.data.token);
      localStorage.setItem('cybermesh_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error('Authentication failed');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('cybermesh_token');
      localStorage.removeItem('cybermesh_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
