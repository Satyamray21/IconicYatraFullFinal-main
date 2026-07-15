import axios from 'axios';

/** JWT for API calls — URL login, localStorage, or embedded on stored user */
export function resolveAuthToken() {
    if (typeof window === 'undefined') return null;
    try {
        const direct =
            localStorage.getItem('token')?.trim() ||
            localStorage.getItem('accessToken')?.trim();
        if (direct) return direct;
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        const u = JSON.parse(raw);
        const t = u?.token || u?.accessToken;
        return t && String(t).trim() ? String(t).trim() : null;
    } catch {
        return null;
    }
}

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

instance.interceptors.request.use((config) => {
    config.headers = config.headers ?? {};
    
    // Inject the tenant domain so the backend knows which company we are
    if (typeof window !== 'undefined') {
        let hostname = window.location.hostname;
        
        // If testing locally, impersonate the Master Tenant so you can actually log in!
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            hostname = 'iconicyatra.com';
        }

        // If accessed via admin.domain.com, strip the admin. prefix to find the correct tenant!
        if (hostname.startsWith('admin.')) {
            hostname = hostname.substring(6);
        }
        config.headers['x-tenant-domain'] = hostname;
    }

    const token = resolveAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (!localStorage.getItem('token')?.trim()) {
            localStorage.setItem('token', token);
        }
    }
    return config;
});

// Intercept 403 Forbidden responses (specifically for suspended tenants)
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403 && error.response?.data?.message?.includes('suspended')) {
            // Clear local storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default instance;