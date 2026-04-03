import { apiFetch } from './apiClient';
import { ENDPOINTS } from './endpoints';
import { saveAuthToken, saveAuthSession, saveUserId, saveProfileData, getAuthSession, clearAll } from '../utils/storage';

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
        ENDPOINTS.AUTH.SEND_OTP,
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
        ENDPOINTS.AUTH.VERIFY_OTP,
        {
            method: 'POST',
            body: JSON.stringify({ phone, otp, requestId, role, language }),
        },
        false,
    );

    // If the role is switching (worker ↔ hirer on the same device without logout),
    // wipe all stale role-specific local state first. Without this, the previous
    // role's worker_profile_data (city, profileImage, job fields, etc.) bleeds
    // into the new role's screens until the backend fetch overwrites it — and if
    // the backend fetch 403s due to a stale JWT still in memory, it never does.
    const newRole = result.user.role.toLowerCase() as 'worker' | 'hirer';
    const existingSession = await getAuthSession();
    if (existingSession?.loggedIn && existingSession.role !== newRole) {
        await clearAll();
    }

    // Persist session
    await saveAuthToken(result.accessToken);
    await saveUserId(result.user.id);
    await saveAuthSession(newRole);
    // Save phone (10-digit, without +91) so onboarding screens can pre-fill it
    const phoneDigits = (result.user.phone ?? phone).replace(/^\+91/, '').replace(/\D/g, '');
    await saveProfileData({ mobileNumber: phoneDigits });

    return result;
}
