import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  timeout: 30000, // queue returns fast; 30s safety only
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const companyId = localStorage.getItem('current_company_id');
    if (companyId) config.headers['X-Company-ID'] = companyId;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) {
          const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


/** Normalise DRF list responses and drop duplicate ids */
export function unwrapList<T extends { id?: string | number }>(data: unknown): T[] {
  let rows: T[] = [];
  if (Array.isArray(data)) {
    rows = data as T[];
  } else if (data && typeof data === "object" && Array.isArray((data as any).results)) {
    rows = (data as any).results as T[];
  }
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const id = row?.id != null ? String(row.id) : "";
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(row);
  }
  return out;
}

export function unwrapCount(data: unknown, fallbackLen = 0): number {
  if (data && typeof data === "object" && typeof (data as any).count === "number") {
    return (data as any).count;
  }
  return fallbackLen;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/token/', { username, password }),
};

export const companiesApi = {
  list: (params?: Record<string, unknown>) => api.get('/companies/', { params }),
  publicList: () => api.get('/companies/public_list/'),
  get: (id: string) => api.get(`/companies/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/companies/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/companies/${id}/`, data),
  delete: (id: string) => api.delete(`/companies/${id}/`),
  uploadLogo: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post(`/companies/${id}/upload_logo/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const subscribersApi = {
  list: (params?: Record<string, unknown>) => api.get('/subscribers/', { params }),
  get: (id: string) => api.get(`/subscribers/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/subscribers/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/subscribers/${id}/`, data),
  delete: (id: string) => api.delete(`/subscribers/${id}/`),
  importCsv: (formData: FormData) =>
    api.post('/subscribers/import_spreadsheet/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  unsubscribe: (id: string, reason?: string) =>
    api.post(`/subscribers/${id}/unsubscribe/`, { reason }),
  resubscribe: (id: string) => api.post(`/subscribers/${id}/resubscribe/`),
};

export const newslettersApi = {
  list: (params?: Record<string, unknown>) => api.get('/newsletters/', { params }),
  get: (id: string) => api.get(`/newsletters/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/newsletters/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/newsletters/${id}/`, data),
  sendNow: (id: string) => api.post(`/newsletters/${id}/send_now/`),
  previewRecipients: (id: string) => api.get(`/newsletters/${id}/preview_recipients/`),
  manualSend: (data: Record<string, unknown>) => api.post('/newsletters/manual-send/', data),
  composeRecipients: (params?: Record<string, unknown>) =>
    api.get('/newsletters/compose-recipients/', { params }),
};

export const templatesApi = {
  list: (params?: Record<string, unknown>) => api.get('/templates/', { params }),
  get: (id: string) => api.get(`/templates/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/templates/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/templates/${id}/`, data),
  preview: (id: string, context?: Record<string, unknown>) =>
    api.post(`/templates/${id}/preview/`, { context }),
  sendTest: (id: string, to?: string) => api.post(`/templates/${id}/send_test/`, { to }),
  uploadHeaderLogo: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post(`/templates/${id}/upload_header_logo/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadFooterLogo: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post(`/templates/${id}/upload_footer_logo/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  clearHeaderLogo: (id: string) => api.post(`/templates/${id}/clear_header_logo/`),
  clearFooterLogo: (id: string) => api.post(`/templates/${id}/clear_footer_logo/`),
  delete: (id: string) => api.delete(`/templates/${id}/`),
  duplicate: (id: string) => api.post(`/templates/${id}/duplicate/`),
};

export const enquiriesApi = {
  list: (params?: Record<string, unknown>) => api.get('/enquiries/', { params }),
  get: (id: string) => api.get(`/enquiries/${id}/`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/enquiries/${id}/`, data),
};

export const articlesApi = {
  list: (params?: Record<string, unknown>) => api.get('/articles/', { params }),
  create: (data: Record<string, unknown>) => api.post('/articles/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/articles/${id}/`, data),
  delete: (id: string) => api.delete(`/articles/${id}/`),
};
