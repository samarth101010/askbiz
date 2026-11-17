import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('askbiz_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('askbiz_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
          localStorage.setItem('askbiz_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        localStorage.removeItem('askbiz_token');
        localStorage.removeItem('askbiz_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const { token: receivedToken, user: receivedUser } = response.data;
      localStorage.setItem('askbiz_token', receivedToken);
      localStorage.setItem('askbiz_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return response.data;
    }
  };

  const signup = async (name, email, password) => {
    const response = await api.post('/auth/signup', { name, email, password });
    if (response.data.success) {
      const { token: receivedToken, user: receivedUser } = response.data;
      localStorage.setItem('askbiz_token', receivedToken);
      localStorage.setItem('askbiz_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return response.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('askbiz_token');
    localStorage.removeItem('askbiz_user');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
