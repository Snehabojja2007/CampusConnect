import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/axiosConfig';
import { isTokenExpired } from '../utils/formatters';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken || isTokenExpired(storedToken)) {
      clearSession();
      setLoading(false);
      return null;
    }

    try {
      const currentUser = await authApi.getCurrentUser();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      setUser(currentUser);
      setToken(storedToken);
      return currentUser;
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        clearSession();
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
    };
    window.addEventListener('campusconnect:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('campusconnect:unauthorized', handleUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (payload) => {
    return authApi.register(payload);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user && !isTokenExpired(token)),
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
