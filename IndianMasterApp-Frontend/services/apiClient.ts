import { getAuthToken, clearAuthToken } from '../utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

// ── Unauthorized handler ──────────────────────────────────────────────────────
// Registered once by the root layout. Called after the token is cleared on any
// 401 response so the app can redirect to the login screen centrally without
// every screen needing its own 401 → redirect logic.
type UnauthorizedHandler = () => void;
let _unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
    _unauthorizedHandler = handler;
}
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

    // Abort if no response within 15 seconds — prevents infinite loading when
    // the server IP is unreachable (TCP SYN never gets a reply).
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
        });
    } catch (networkErr: any) {
        const isTimeout = networkErr?.name === 'AbortError';
        throw new ApiError(
            0,
            isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
            isTimeout
                ? `Request timed out after 15s. Check the backend is running and EXPO_PUBLIC_API_URL in .env matches your machine's LAN IP (${BASE_URL}).`
                : `Cannot reach server at ${url}. Check EXPO_PUBLIC_API_URL in .env matches your machine's LAN IP.`,
            networkErr?.message,
        );
    } finally {
        clearTimeout(timeoutId);
    }

    // Safe JSON parse — server may return HTML (e.g. 502 from a proxy) or an
    // empty body. Throwing a clean ApiError here prevents an ugly SyntaxError
    // from bubbling up to the UI.
    let body: ApiEnvelope<T>;
    try {
        body = await response.json();
    } catch {
        throw new ApiError(
            response.status,
            'INVALID_RESPONSE',
            `Server returned a non-JSON response (HTTP ${response.status}). The backend may be down or returning an error page.`,
        );
    }

    if (!response.ok || !body.success) {
        // 401 means the stored token is no longer valid — clear it so the app
        // doesn't keep sending a bad token on every subsequent request, then
        // fire the centralized handler so the root layout can redirect to login.
        if (response.status === 401) {
            await clearAuthToken();
            _unauthorizedHandler?.();
        }

        // Centralized human-readable fallback messages per status code.
        const STATUS_MESSAGES: Record<number, string> = {
            401: 'Session expired. Please log in again.',
            403: 'You do not have permission to perform this action.',
            500: 'Server error. Please try again later.',
        };

        throw new ApiError(
            response.status,
            body.error?.code ?? 'UNKNOWN_ERROR',
            body.error?.message
                ?? STATUS_MESSAGES[response.status]
                ?? body.message
                ?? 'Request failed',
            body.error?.details,
        );
    }

    return body.data as T;
}
