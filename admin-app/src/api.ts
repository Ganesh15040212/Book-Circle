// Central API configuration for BookCircle PHP backend
// Requests go through the Vite dev proxy (/api → http://localhost/bookcircle-api)
export const API_BASE = '/api';

export const apiFetch = async (
    path: string,
    options: RequestInit = {},
    token?: string | null
): Promise<Response> => {
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type to JSON if body is not FormData
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    return fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });
};
