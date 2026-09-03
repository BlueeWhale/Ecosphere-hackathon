import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load authenticated user on initial app render
  useEffect(() => {
    // DEMO MODE ONLY — authentication bypass enabled for hackathon demo
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      setUser({ name: 'DealPilot Demo', email: 'demo@dealpilot.ai', role: 'admin' });
      setLoading(false);
      return;
    }

    const checkAuthStatus = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        if (response.data?.success) {
          setUser(response.data.data.user);
        }
      } catch (err) {
        localStorage.removeItem('dealpilot_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    if (response.data?.success) {
      const { user, token } = response.data.data;
      if (token) localStorage.setItem('dealpilot_token', token);
      setUser(user);
    }
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await authAPI.register({ name, email, password });
    if (response.data?.success) {
      const { user, token } = response.data.data;
      if (token) localStorage.setItem('dealpilot_token', token);
      setUser(user);
    }
    return response.data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('dealpilot_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        setUser,
      }}
    >
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