// api/axiosConfig.js (Fixed with auth interceptor and refresh logic)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',  // No trailing slash
});

// Request Interceptor: Add Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const tokensStr = localStorage.getItem('authTokens');
    if (tokensStr) {
      try {
        const tokens = JSON.parse(tokensStr);
        if (tokens.access) {
          config.headers['Authorization'] = `Bearer ${tokens.access}`;
          console.log(`[Auth] Added Bearer token to request: ${config.url}`);  // Debug log
        } else {
          console.warn('[Auth] No access token found in authTokens');
        }
      } catch (e) {
        console.error('[Auth] Failed to parse authTokens:', e);
      }
    } else {
      console.warn('[Auth] No authTokens in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('[Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 by refreshing token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokensStr = localStorage.getItem('authTokens');
      if (tokensStr) {
        try {
          const tokens = JSON.parse(tokensStr);
          if (tokens.refresh) {
            console.log('[Auth] Refreshing token...');
            const refreshResponse = await axios.post('http://127.0.0.1:8000/api/v1/auth/token/refresh/', { refresh: tokens.refresh });
            const newTokens = { ...tokens, access: refreshResponse.data.access };
            localStorage.setItem('authTokens', JSON.stringify(newTokens));
            api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access}`;
            originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;
            console.log('[Auth] Token refreshed successfully');
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('[Auth] Token refresh failed:', refreshError);
          // Logout if refresh fails
          localStorage.removeItem('authTokens');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    console.error('[Response Error]:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
