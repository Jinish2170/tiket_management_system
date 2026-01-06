import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Services
export const authService = {
  register: async (name, email, password, role = 'user') => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      name,
      email,
      password,
      role,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};

// User Services
export const userService = {
  getAll: async () => {
    const response = await api.get("/auth/users");
    return response.data;
  },

  updateRole: async (userId, role) => {
    const response = await api.put(`/auth/users/${userId}/role`, { role });
    return response.data;
  },
};

// Ticket Services
export const ticketService = {
  getAll: async (page = 1, limit = 10, status = '') => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    const response = await api.get(`/tickets?${params}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (ticketData) => {
    const response = await api.post("/tickets", ticketData);
    return response.data;
  },

  update: async (id, ticketData) => {
    const response = await api.put(`/tickets/${id}`, ticketData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/tickets/${id}/status`, { status });
    return response.data;
  },

  assignTicket: async (id, assignedToUserId) => {
    const response = await api.put(`/tickets/${id}/assign`, { assignedToUserId });
    return response.data;
  },

  revokeTicket: async (id) => {
    const response = await api.put(`/tickets/${id}/revoke`, {});
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  },
};

// Comment Services
export const commentService = {
  getByTicketId: async (ticketId) => {
    const response = await api.get(`/comments/${ticketId}`);
    return response.data;
  },

  create: async (ticketId, body) => {
    const response = await api.post("/comments", { ticketId, body });
    return response.data;
  },

  update: async (id, body) => {
    const response = await api.put(`/comments/${id}`, { body });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },
};

// Activity Services
export const activityService = {
  getByTicketId: async (ticketId) => {
    const response = await api.get(`/activity/${ticketId}`);
    return response.data;
  },
};

// Tag Services
export const tagService = {
  getAll: async () => {
    const response = await api.get("/tags");
    return response.data;
  },

  create: async (name) => {
    const response = await api.post("/tags", { name });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  },
};

export default api;
