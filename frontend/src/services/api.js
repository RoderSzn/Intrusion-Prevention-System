import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const getThreats = async (limit = 100, offset = 0) => {
  const response = await api.get(`/admin/threats?limit=${limit}&offset=${offset}`);
  return response.data;
};

export const getThreatById = async (id) => {
  const response = await api.get(`/admin/threats/${id}`);
  return response.data;
};

export const clearThreats = async () => {
  const response = await api.delete('/admin/threats');
  return response.data;
};

export const getStatistics = async (days = 30) => {
  const response = await api.get(`/admin/statistics?days=${days}`);
  return response.data;
};

export const getRules = async () => {
  const response = await api.get('/admin/rules');
  return response.data;
};

export const getRuleById = async (id) => {
  const response = await api.get(`/admin/rules/${id}`);
  return response.data;
};

export const toggleRule = async (id) => {
  const response = await api.patch(`/admin/rules/${id}/toggle`);
  return response.data;
};

export const updateRule = async (id, data) => {
  const response = await api.put(`/admin/rules/${id}`, data);
  return response.data;
};

export const createRule = async (data) => {
  const response = await api.post('/admin/rules', data);
  return response.data;
};

export const deleteRule = async (id) => {
  const response = await api.delete(`/admin/rules/${id}`);
  return response.data;
};

export const getIPTracking = async (status = null) => {
  const url = status ? `/admin/ip-tracking?status=${status}` : '/admin/ip-tracking';
  const response = await api.get(url);
  return response.data;
};

export const getDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const testSQLInjection = async () => {
  try {
    await api.get('/api/search?q=' + encodeURIComponent("' OR '1'='1"));
  } catch (error) {
    return error.response?.data;
  }
};

export const testXSS = async () => {
  try {
    await api.post('/api/comment', { 
      comment: '<script>alert("xss")</script>' 
    });
  } catch (error) {
    return error.response?.data;
  }
};

export const testPathTraversal = async () => {
  try {
    await api.get('/api/file?path=../../etc/passwd');
  } catch (error) {
    return error.response?.data;
  }
};

export const testCommandInjection = async () => {
  try {
    await api.post('/api/exec', { 
      cmd: 'ls; cat /etc/passwd' 
    });
  } catch (error) {
    return error.response?.data;
  }
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;