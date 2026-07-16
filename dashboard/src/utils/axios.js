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
    const token = resolveAuthToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
        if (!localStorage.getItem('token')?.trim()) {
            localStorage.setItem('token', token);
        }
    }
    return config;
});

export default instance;