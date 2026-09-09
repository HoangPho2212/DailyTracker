import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const resolvedBaseUrl = rawBaseUrl !== undefined && rawBaseUrl !== ''
  ? rawBaseUrl.replace(/\/$/, '')
  : (import.meta.env.DEV ? 'http://localhost:3000' : '');

const apiClient = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach JWT bearer token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dailytracker_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('dailytracker_token');
      localStorage.removeItem('dailytracker_user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Helper to handle JayContract response
const handleResponse = (response) => {
  if (response.data && response.data.success !== undefined) {
    if (!response.data.success) {
      throw new Error(response.data.message || 'API operation failed');
    }
    return response.data.data;
  }
  return response.data;
};

export const apiService = {
  /**
   * Fetch daily tasks for a given date (YYYY-MM-DD)
   */
  async getDay(date) {
    const response = await apiClient.get(`/api/days/${date}`);
    return handleResponse(response);
  },

  /**
   * Add a new task to a specific date
   */
  async addTask(date, title) {
    const response = await apiClient.post(`/api/days/${date}/tasks`, { title });
    return handleResponse(response);
  },

  /**
   * Update task (toggle isCompleted or update title)
   */
  async updateTask(date, taskId, payload) {
    const response = await apiClient.patch(`/api/days/${date}/tasks/${taskId}`, payload);
    return handleResponse(response);
  },

  /**
   * Delete a task
   */
  async deleteTask(date, taskId) {
    const response = await apiClient.delete(`/api/days/${date}/tasks/${taskId}`);
    return handleResponse(response);
  },

  /**
   * Get analytics and review summary for a given reference date
   */
  async getAnalyticsSummary(date) {
    const url = date ? `/api/days/analytics/summary?date=${date}` : '/api/days/analytics/summary';
    const response = await apiClient.get(url);
    return handleResponse(response);
  },

  /**
   * Authentication methods
   */
  async login(username, password) {
    const response = await apiClient.post('/api/auth/login', { username, password });
    const data = handleResponse(response);
    if (data.token) {
      localStorage.setItem('dailytracker_token', data.token);
      localStorage.setItem('dailytracker_user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(username, password) {
    const response = await apiClient.post('/api/auth/register', { username, password });
    const data = handleResponse(response);
    if (data.token) {
      localStorage.setItem('dailytracker_token', data.token);
      localStorage.setItem('dailytracker_user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('dailytracker_token');
    localStorage.removeItem('dailytracker_user');
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('dailytracker_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('dailytracker_token');
  },

  async getMe() {
    const response = await apiClient.get('/api/auth/me');
    return handleResponse(response);
  }
};

export default apiService;
