import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiFetch } from './apiClient';
import { ENDPOINTS } from './endpoints';

// Configure how notifications appear while the app is in the foreground.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Register for Expo push notifications.
 * - Requests permission from the OS.
 * - Gets the Expo push token.
 * - Sends the token to the backend (silently ignores errors if not logged in).
 *
 * Call this once after the app loads (and again after login).
 */
export async function registerForPushNotifications(): Promise<void> {
    // Push notifications only work on physical devices.
    if (!Device.isDevice) return;

    // Android needs an explicit notification channel.
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Indian Master',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF6B35',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        // User denied — nothing to do, app still works without push.
        return;
    }

    const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        await savePushToken(tokenData.data);
    } catch {
        // Non-critical — push notifications simply won't work if this fails.
    }
}

/**
 * Send the Expo push token to the backend for the currently authenticated user.
 * Silently ignores errors (e.g. user not logged in yet).
 */
async function savePushToken(token: string): Promise<void> {
    try {
        await apiFetch<null>(ENDPOINTS.USER.PUSH_TOKEN, {
            method: 'PUT',
            body: JSON.stringify({ token }),
        });
    } catch {
        // Non-critical.
    }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    isRead: boolean;
    unreadCount: number;
    updatedAt: string;
    createdAt: string;
}

export interface NotificationsPage {
    data: NotificationItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch paginated notifications for the authenticated user (all, read + unread).
 */
export async function getNotifications(page = 1, limit = 20): Promise<NotificationsPage> {
    return apiFetch<NotificationsPage>(`${ENDPOINTS.NOTIFICATIONS.ROOT}?page=${page}&limit=${limit}`);
}

/**
 * Get the count of unread notifications for the authenticated user.
 * Returns 0 on any error so callers never need to handle exceptions.
 */
export async function getUnreadCount(): Promise<number> {
    try {
        const res = await apiFetch<{ unreadCount: number }>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
        return res.unreadCount ?? 0;
    } catch {
        return 0;
    }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
    await apiFetch<null>(ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId), { method: 'PATCH' });
}
