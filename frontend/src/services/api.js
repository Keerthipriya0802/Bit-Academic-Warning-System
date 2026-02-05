import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { error: 'Network error' });
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

// Student API
export const studentAPI = {
  getMyData: () => api.get('/students/my-data'),
  getMyRiskAnalysis: () => api.get('/students/my-risk-analysis'),
  updateMyData: (data) => api.put('/students/update-data', data),
  getPerformanceHistory: () => api.get('/students/performance-history'),
  getSuggestions: () => api.get('/students/suggestions')
};

// Staff API
export const staffAPI = {
  getAllStudents: (params) => api.get('/staff/students', { params }),
  getAtRiskStudents: (params) => api.get('/staff/at-risk-students', { params }),
  getStudentDetails: (id) => api.get(`/staff/student/${id}`),
  updateStudentData: (id, data) => api.put(`/staff/student/${id}/update`, data),
  analyzeClass: (data) => api.post('/staff/analyze-class', data),
  getClassStats: (params) => api.get('/staff/class-stats', { params }),
  generateReport: (params) => api.get('/staff/generate-report', { params })
};

// System API
export const systemAPI = {
  healthCheck: () => api.get('/health')
};

export default api;