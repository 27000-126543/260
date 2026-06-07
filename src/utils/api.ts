const API_BASE = 'http://localhost:3001/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  auth: {
    login: (data: { phone: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: { phone: string; name: string; password: string }) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    getProfile: () => request('/auth/profile'),
    updateProfile: (data: unknown) =>
      request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  },
  lands: {
    list: () => request('/lands'),
    get: (id: string) => request(`/lands/${id}`),
    create: (data: unknown) =>
      request('/lands', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      request(`/lands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/lands/${id}`, { method: 'DELETE' }),
  },
  recommendations: {
    crops: (landId: string) => request(`/recommendations/crops/${landId}`),
    fertilizer: (landId: string) => request(`/recommendations/fertilization/${landId}`),
  },
  store: {
    products: (params?: { category?: string; keyword?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/store/products?${query.toString()}`);
    },
    product: (id: string) => request(`/store/products/${id}`),
    orders: (params?: { status?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/store/orders?${query.toString()}`);
    },
    order: (id: string) => request(`/store/orders/${id}`),
    createOrder: (data: unknown) =>
      request('/store/orders', { method: 'POST', body: JSON.stringify(data) }),
  },
  field: {
    detectPest: (formData: FormData) =>
      request('/field/detect', { method: 'POST', body: formData }),
    detections: () => request('/field/detections'),
    detection: (id: string) => request(`/field/detections/${id}`),
    applyExpert: (id: string) =>
      request(`/field/detections/${id}/expert`, { method: 'POST' }),
    experts: () => request('/field/experts'),
  },
  weather: {
    current: (params?: { city?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/weather/current?${query.toString()}`);
    },
    forecast: (params?: { city?: string; days?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/weather/forecast?${query.toString()}`);
    },
    alerts: (params?: { city?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/weather/alerts?${query.toString()}`);
    },
    tips: () => request('/weather/tips'),
    getCurrent: (params?: { city?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/weather/current?${query.toString()}`);
    },
    getAlerts: (params?: { city?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/weather/alerts?${query.toString()}`);
    },
  },
  market: {
    products: (params?: { category?: string; status?: string; keyword?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/market/products?${query.toString()}`);
    },
    myProducts: () => request('/market/products/my'),
    product: (id: string) => request(`/market/products/${id}`),
    createProduct: (data: unknown) =>
      request('/market/products', { method: 'POST', body: JSON.stringify(data) }),
    suggestPrice: (params: { name: string; category?: string; quality?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/market/suggest-price?${query.toString()}`);
    },
    trace: (code: string) => request(`/market/trace/${code}`),
    createOrder: (data: unknown) =>
      request('/market/orders', { method: 'POST', body: JSON.stringify(data) }),
  },
  finance: {
    products: () => request('/finance/products'),
    getProducts: () => request('/finance/products'),
    creditLimit: () => request('/finance/credit-limit'),
    loans: (params?: { status?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/finance/loans?${query.toString()}`);
    },
    getMyLoans: () => request('/finance/loans'),
    apply: (data: unknown) =>
      request('/finance/apply', { method: 'POST', body: JSON.stringify(data) }),
  },
  member: {
    info: () => request('/member/info'),
    getInfo: () => request('/member/info'),
    levels: () => request('/member/levels'),
  },
  admin: {
    dashboard: (params?: { region?: string; startDate?: string; endDate?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/admin/dashboard?${query.toString()}`);
    },
    getDashboard: () => request('/admin/dashboard'),
    predictions: () => request('/admin/predictions'),
    monthlyReport: (params?: { month?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/admin/report/monthly?${query.toString()}`);
    },
    exportReport: (params?: { month?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return `${API_BASE}/admin/report/monthly/export?${query.toString()}`;
    },
  },
};
