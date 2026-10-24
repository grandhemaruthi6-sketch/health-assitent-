/**
 * HealthCopilot AI — Backend API Client
 * Connects frontend React components to persistent backend endpoints.
 */

const API_BASE = '/api';

export const apiClient = {
  // Token helper
  getToken() {
    try {
      return localStorage.getItem('hc_auth_token') || null;
    } catch {
      return null;
    }
  },

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem('hc_auth_token', token);
      } else {
        localStorage.removeItem('hc_auth_token');
      }
    } catch (e) {
      console.warn('Could not persist auth token', e);
    }
  },

  getHeaders(customHeaders = {}) {
    const headers = { ...customHeaders };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = this.getHeaders(options.headers || {});

    // Don't set Content-Type if sending FormData (browser sets boundary automatically)
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error?.message || `Request failed with status ${res.status}`);
      err.code = data.error?.code || 'API_ERROR';
      err.status = res.status;
      err.details = data.error?.details || null;
      throw err;
    }

    return data;
  },

  // ==========================================================================
  // Auth API
  // ==========================================================================
  auth: {
    async register(userData) {
      const res = await apiClient.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      if (res.data?.token) {
        apiClient.setToken(res.data.token);
      }
      return res.data;
    },

    async login(email, password) {
      const res = await apiClient.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.data?.token) {
        apiClient.setToken(res.data.token);
      }
      return res.data;
    },

    async getMe() {
      const res = await apiClient.request('/auth/me');
      return res.data?.user;
    },

    async syncFirebaseUser({ uid, email, name, phone, idToken }) {
      const res = await apiClient.request('/auth/firebase-sync', {
        method: 'POST',
        body: JSON.stringify({ uid, email, name, phone, idToken })
      });
      if (res.data?.token) {
        apiClient.setToken(res.data.token);
      }
      return res.data;
    },

    logout() {
      apiClient.setToken(null);
    }
  },

  // ==========================================================================
  // Hospitals API
  // ==========================================================================
  hospitals: {
    async getAll() {
      const res = await apiClient.request('/hospitals');
      return res.data || [];
    },

    async create({ name, branch, location, department }) {
      const res = await apiClient.request('/hospitals', {
        method: 'POST',
        body: JSON.stringify({ name, branch, location, department })
      });
      return res.data;
    }
  },

  // ==========================================================================
  // Visits API
  // ==========================================================================
  visits: {
    async create({ hospitalId, visitDate, physicianName, department, reasonForVisit, idempotencyKey }) {
      const res = await apiClient.request('/visits', {
        method: 'POST',
        body: JSON.stringify({
          hospitalId,
          visitDate,
          physicianName,
          department,
          reasonForVisit,
          idempotencyKey
        })
      });
      return res.data;
    }
  },

  // ==========================================================================
  // Timeline API (Genuine Empty State supported)
  // ==========================================================================
  timeline: {
    async getTimeline() {
      const res = await apiClient.request('/timeline');
      return res.data || [];
    }
  },

  // ==========================================================================
  // Reports API
  // ==========================================================================
  reports: {
    async getAll(filters = {}) {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'All') {
        params.append('category', filters.category);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.request(`/reports${qs}`);
      return res.data || [];
    },

    async getById(reportId) {
      const res = await apiClient.request(`/reports/${reportId}`);
      return res.data;
    },

    async uploadReport(formDataOrPayload) {
      let options;
      if (formDataOrPayload instanceof FormData) {
        options = {
          method: 'POST',
          body: formDataOrPayload
        };
      } else {
        options = {
          method: 'POST',
          body: JSON.stringify(formDataOrPayload)
        };
      }
      const res = await apiClient.request('/reports', options);
      return res.data;
    },

    async updateReport(reportId, updates) {
      const res = await apiClient.request(`/reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      return res.data;
    },

    async deleteReport(reportId) {
      const res = await apiClient.request(`/reports/${reportId}`, {
        method: 'DELETE'
      });
      return res.data;
    },

    async getSummary(reportId, lang = 'en') {
      const res = await apiClient.request(`/reports/${reportId}/summary?lang=${encodeURIComponent(lang)}`);
      return res.data;
    },

    async generateSummary(reportId, lang = 'en', force = true) {
      const res = await apiClient.request(`/reports/${reportId}/summary/generate`, {
        method: 'POST',
        body: JSON.stringify({ language: lang, force })
      });
      return res.data;
    }
  }
};
