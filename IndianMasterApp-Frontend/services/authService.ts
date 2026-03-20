import { apiFetch } from './apiClient';
import { saveAuthToken, saveAuthSession, saveUserId, saveProfileData } from '../utils/storage';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SendOTPResponse {
    requestId: string;
    expiresIn: number; // seconds
}

export interface AuthUser {
    id: string;
    phone: string;
    role: string;
    language: string;
}

export interface AuthResponse {
    accessToken: string;
    expiresIn: number; // seconds
    user: AuthUser;
}

// ── Service functions ────────────────────────────────────────────────────────

export async function sendOTP(phone: string): Promise<SendOTPResponse> {
    console.log('calling sendOtp API', { phone });
    return apiFetch<SendOTPResponse>(
        '/api/v1/auth/send-otp',
        {
            method: 'POST',
            body: JSON.stringify({ phone }),
        },
        false,
    );
}

export async function verifyOTP(
    phone: string,
    otp: string,
    requestId: string,
    role: 'WORKER' | 'HIRER' | 'ADMIN',
    language: 'en' | 'hi' | 'ta' = 'en',
): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>(
        '/api/v1/auth/verify-otp',
        {
            method: 'POST',
            body: JSON.stringify({ phone, otp, requestId, role, language }),
        },
        false,
    );

    // Persist session
    await saveAuthToken(result.accessToken);
    await saveUserId(result.user.id);
    await saveAuthSession(
        result.user.role.toLowerCase() as 'worker' | 'hirer',
    );
    // Save phone (10-digit, without +91) so onboarding screens can pre-fill it
    const phoneDigits = (result.user.phone ?? phone).replace(/^\+91/, '').replace(/\D/g, '');
    await saveProfileData({ mobileNumber: phoneDigits });

    return result;
}
