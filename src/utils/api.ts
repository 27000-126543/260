const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
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
  },
  lands: {
    list: () => request('/lands'),
    get: (id: string) => request(`/lands/${id}`),
    create: (data: unknown) =>
      request('/lands', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      request(`/lands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  recommendations: {
    crops: () => request('/recommendations/crops'),
    fertilizer: () => request('/recommendations/fertilizer'),
  },
  store: {
    products: (params?: { category?: string; search?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>);
      return request(`/store/products?${query.toString()}`);
    },
    product: (id: string) => request(`/store/products/${id}`),
    orders: () => request('/store/orders'),
    createOrder: (data: unknown) =>
      request('/store/orders', { method: 'POST', body: JSON.stringify(data) }),
    logistics: (id: string) => request(`/store/logistics/${id}`),
  },
  field: {
    detectPest: (data: unknown) =>
      request('/field/detect-pest', { method: 'POST', body: JSON.stringify(data) }),
    experts: () => request('/field/experts'),
    submitDiagnosis: (data: unknown) =>
      request('/field/diagnosis', { method: 'POST', body: JSON.stringify(data) }),
  },
  weather: {
    current: () => request('/weather/current'),
    getCurrent: () => request('/weather/current'),
    forecast: () => request('/weather/forecast'),
    warnings: () => request('/weather/warnings'),
    getAlerts: () => request('/weather/warnings'),
  },
  market: {
    products: () => request('/market/products'),
    createProduct: (data: unknown) =>
      request('/market/products', { method: 'POST', body: JSON.stringify(data) }),
    trace: (code: string) => request(`/market/trace/${code}`),
  },
  finance: {
    loanProducts: () => request('/finance/loan-products'),
    getProducts: () => request('/finance/loan-products'),
    loanApplications: () => request('/finance/loan-applications'),
    getMyLoans: () => request('/finance/loan-applications'),
    applyLoan: (data: unknown) =>
      request('/finance/loan-apply', { method: 'POST', body: JSON.stringify(data) }),
    creditScore: () => request('/finance/credit-score'),
  },
  member: {
    level: () => request('/member/level'),
    getInfo: () => request('/member/level'),
    benefits: () => request('/member/benefits'),
  },
  admin: {
    dashboard: () => request('/admin/dashboard'),
    getDashboard: () => request('/admin/dashboard'),
    reports: () => request('/admin/reports'),
    news: () => request('/admin/news'),
  },
};
