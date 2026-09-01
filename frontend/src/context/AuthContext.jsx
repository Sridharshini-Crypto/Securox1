import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000/api';
    }
    if (hostname && hostname !== 'localhost') {
      return `http://${hostname}:8000/api`;
    }
  }
  return 'http://localhost:8000/api';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('securox_token');
    } catch (e) {
      return null;
    }
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  // Step-Up state
  const [stepUpRequired, setStepUpRequired] = useState(false);
  const [stepUpReason, setStepUpReason] = useState(null);
  const [pendingActionCallback, setPendingActionCallback] = useState(null);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  // Intercept 403 or Step-Up triggers
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 403) {
          const detail = error.response.data?.detail || '';
          if (detail.includes('ZERO_TRUST_STEP_UP_REQUIRED') || detail.includes('Step-up')) {
            setStepUpReason(detail);
            setStepUpRequired(true);
          }
        } else if (error.response && error.response.status === 401) {
          // Token expired or invalid session
          localStorage.removeItem('securox_token');
          setToken(null);
          setUser(null);
          delete api.defaults.headers.common['Authorization'];
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const resp = await api.get('/auth/me');
      setUser(resp.data.user);
    } catch (err) {
      console.warn("Stored session expired or invalid, clearing stale token:", err?.response?.data?.detail || err.message);
      localStorage.removeItem('securox_token');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const register = async (registerData) => {
    setLoading(true);
    setAuthError(null);
    try {
      let resp;
      try {
        resp = await api.post('/auth/register', registerData);
      } catch (firstErr) {
        if (!firstErr.response && typeof window !== 'undefined') {
          const altHost = window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:8000/api' 
            : 'http://127.0.0.1:8000/api';
          resp = await axios.post(`${altHost}/auth/register`, registerData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 8000
          });
          api.defaults.baseURL = altHost;
        } else {
          throw firstErr;
        }
      }

      return { success: true, data: resp.data };
    } catch (err) {
      console.error("Registration failed:", err);
      let msg = 'Registration failed. Please check form fields.';
      if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'Cannot reach backend server. Please verify the FastAPI backend is running.';
      }
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setAuthError(null);
    try {
      let resp;
      try {
        resp = await api.post('/auth/login', credentials);
      } catch (firstErr) {
        if (!firstErr.response && typeof window !== 'undefined') {
          const altHost = window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:8000/api' 
            : 'http://127.0.0.1:8000/api';
          resp = await axios.post(`${altHost}/auth/login`, credentials, { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 8000
          });
          api.defaults.baseURL = altHost;
        } else {
          throw firstErr;
        }
      }

      const { access_token, user: userData, requires_step_up, risk_assessment } = resp.data;
      
      localStorage.setItem('securox_token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(userData);

      if (requires_step_up) {
        setStepUpReason(`Elevated threat score: ${(risk_assessment.anomaly_score * 100).toFixed(0)}%. Step-up verification required.`);
        setStepUpRequired(true);
      }

      return { success: true, data: resp.data };
    } catch (err) {
      console.error("Login attempt failed:", err);
      let msg = 'Authentication failed. Please verify credentials.';
      if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'Cannot reach backend server. Please make sure the FastAPI backend is running on http://127.0.0.1:8000';
      }
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const verifyStepUp = async (method, tokenOrPayload) => {
    try {
      const resp = await api.post('/auth/step-up', {
        verification_type: method,
        token_or_payload: tokenOrPayload
      });
      setStepUpRequired(false);
      setStepUpReason(null);
      if (pendingActionCallback) {
        pendingActionCallback();
        setPendingActionCallback(null);
      }
      return { success: true, data: resp.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Step-up verification failed' };
    }
  };

  const logout = async () => {
    try {
      if (token) await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('securox_token');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      authError,
      setAuthError,
      isAuthenticated: !!token && !!user,
      register,
      login,
      logout,
      stepUpRequired,
      stepUpReason,
      setStepUpRequired,
      verifyStepUp,
      setPendingActionCallback
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
