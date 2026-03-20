import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'worker_profile_data';
const AUTH_SESSION_KEY = 'auth_session';

export const saveProfileData = async (data: any) => {
    try {
        const existingData = await getProfileData();
        const newData = { ...existingData, ...data };
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newData));
        console.log('Profile data saved:', newData);
        return newData;
    } catch (e) {
        console.error('Failed to save profile data', e);
    }
};

export const getProfileData = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(PROFILE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (e) {
        console.error('Failed to fetch profile data', e);
        return {};
    }
};

export const clearProfileData = async () => {
    try {
        await AsyncStorage.removeItem(PROFILE_KEY);
    } catch (e) {
        console.error('Failed to clear profile data', e);
    }
};

// ── Auth Session (Login state across app restarts) ─────────────────

export const saveAuthSession = async (role: 'hirer' | 'worker') => {
    try {
        await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ role, loggedIn: true }));
    } catch (e) {
        console.error('Failed to save auth session', e);
    }
};

export const getAuthSession = async (): Promise<{ role: 'hirer' | 'worker'; loggedIn: boolean } | null> => {
    try {
        const value = await AsyncStorage.getItem(AUTH_SESSION_KEY);
        return value ? JSON.parse(value) : null;
    } catch (e) {
        console.error('Failed to get auth session', e);
        return null;
    }
};

export const clearAuthSession = async () => {
    try {
        await AsyncStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {
        console.error('Failed to clear auth session', e);
    }
};

// ── JWT Token ───────────────────────────────────────────────────────────────

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_ID_KEY = 'auth_user_id';

export const saveAuthToken = async (token: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (e) {
        console.error('Failed to save auth token', e);
    }
};

export const getAuthToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (e) {
        console.error('Failed to get auth token', e);
        return null;
    }
};

export const clearAuthToken = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (e) {
        console.error('Failed to clear auth token', e);
    }
};

export const saveUserId = async (userId: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(AUTH_USER_ID_KEY, userId);
    } catch (e) {
        console.error('Failed to save user id', e);
    }
};

export const getUserId = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(AUTH_USER_ID_KEY);
    } catch (e) {
        console.error('Failed to get user id', e);
        return null;
    }
};

export const clearAll = async (): Promise<void> => {
    await Promise.all([
        clearAuthToken(),
        clearAuthSession(),
        clearProfileData(),
        AsyncStorage.removeItem(AUTH_USER_ID_KEY),
    ]);
};
