import { getAuthToken } from '../utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
console.log('API BASE_URL', BASE_URL);

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: unknown,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    authenticated = true,
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (authenticated) {
        const token = await getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const url = `${BASE_URL}${path}`;
    console.log('API REQUEST', url, options.body);
    const response = await fetch(url, {
        ...options,
        headers,
    });

    const body: ApiEnvelope<T> = await response.json();

    if (!response.ok || !body.success) {
        throw new ApiError(
            response.status,
            body.error?.code ?? 'UNKNOWN_ERROR',
            body.error?.message ?? body.message ?? 'Request failed',
            body.error?.details,
        );
    }

    return body.data as T;
}
