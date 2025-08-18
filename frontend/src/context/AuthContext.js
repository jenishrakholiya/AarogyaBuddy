// AuthContext.js (Simplified; interceptors moved to axiosConfig.js)
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';  // Now uses the fixed instance

const AuthContext = createContext();
export default AuthContext;

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
  );
  const [user, setUser] = useState(() =>
    localStorage.getItem('authTokens') ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access) : null
  );
  const [loading, setLoading] = useState(true);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const navigate = useNavigate();

  const loginUser = async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      if (response.status === 200) {
        const data = response.data;
        localStorage.setItem('authTokens', JSON.stringify(data));  // Store tokens first
        setAuthTokens(data);
        setUser(jwtDecode(data.access));
        console.log('[Login] Tokens stored successfully');  // Debug log
        navigate('/');
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('[Login Error]:', error);
    }
  };

  const logoutUser = useCallback(() => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
    navigate('/login');
  }, [navigate]);

  const triggerDashboardRefresh = useCallback(() => {
    setDashboardRefresh((prev) => prev + 1);
  }, []);

  useEffect(() => {
    setLoading(false);  // No interceptors here anymore
  }, []);

  const contextData = { user, loginUser, logoutUser, dashboardRefresh, triggerDashboardRefresh };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};
