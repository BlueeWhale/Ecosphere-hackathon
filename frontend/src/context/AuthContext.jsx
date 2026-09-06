import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const getDashboardRouteForRole = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  return '/dashboard';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      setUser({
        _id: 'demo-user',
        name: 'DealPilot Demo',
        email: 'demo@dealpilot.ai',
        role: 'admin',
        avatar: '',
      });
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

  const login = async (email, password, accountType = 'company') => {
    const response = await authAPI.login({ email, password, accountType });
    if (response.data?.success) {
      const { user: userData, token } = response.data.data;
      if (token) localStorage.setItem('dealpilot_token', token);
      setUser(userData);
    }
    return response.data;
  };

  const register = async (name, email, password, confirmPassword, profile = {}) => {
    const response = await authAPI.register({ name, email, password, confirmPassword, ...profile });
    if (response.data?.success) {
      const { user: userData, token } = response.data.data;
      if (token) localStorage.setItem('dealpilot_token', token);
      setUser(userData);
    }
    return response.data;
  };

  const googleLogin = async (googleAuthData) => {
    const response = await authAPI.googleLogin(googleAuthData);
    if (response.data?.success) {
      const { user: userData, token } = response.data.data;
      if (token) localStorage.setItem('dealpilot_token', token);
      setUser(userData);
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
        isAdmin: user?.role === 'admin',
        login,
        register,
        googleLogin,
        logout,
        setUser,
        getDashboardRoute: () => getDashboardRouteForRole(user?.role),
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
