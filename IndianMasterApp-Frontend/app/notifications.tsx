import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, AppState,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
    NotificationItem,
    getNotifications,
    markNotificationRead,
} from '@/services/notificationService';

// ── Icon shown inside each notification card ──────────────────────────────────

const IndianMasterIcon = () => (
    <View style={styles.lokalIconContainer}>
        <MaterialCommunityIcons name="chef-hat" size={20} color="#2563EB" style={{ marginBottom: -2 }} />
        <Text style={styles.logoTextMain}>INDIAN</Text>
        <Text style={styles.logoTextSub}>MASTER</Text>
        <View style={styles.logoBottomBar} />
    </View>
);

// ── Per-type icon name ────────────────────────────────────────────────────────

function typeIcon(type: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
    switch (type) {
        case 'NEW_APPLICATION':       return 'file-document-outline';
        case 'APP_STATUS_CHANGE':     return 'briefcase-check-outline';
        case 'JOB_MATCH':            return 'magnify';
        case 'CHAT_MESSAGE':         return 'message-outline';
        case 'KYC_APPROVED':         return 'shield-check-outline';
        case 'KYC_REJECTED':         return 'shield-alert-outline';
        case 'PROFILE_VIEWED':       return 'eye-outline';
        case 'INTERVIEW_SCHEDULED':  return 'calendar-check-outline';
        case 'WORKER_MATCHED':       return 'account-search-outline';
        case 'PAYMENT_SUCCESS':      return 'check-circle-outline';
        case 'PLAN_EXPIRY':          return 'clock-alert-outline';
        default:                      return 'bell-outline';
    }
}

// ── Human-readable label per notification type ────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
    NEW_APPLICATION:      'New Application',
    APP_STATUS_CHANGE:    'Application Update',
    JOB_MATCH:            'Job Match',
    CHAT_MESSAGE:         'New Message',
    KYC_APPROVED:         'KYC Approved',
    KYC_REJECTED:         'KYC Rejected',
    PROFILE_VIEWED:       'Profile Viewed',
    INTERVIEW_SCHEDULED:  'Interview Scheduled',
    WORKER_MATCHED:       'Worker Match',
    PAYMENT_SUCCESS:      'Payment Successful',
    PLAN_EXPIRY:          'Plan Expiry',
};

function typeLabel(type: string): string {
    return TYPE_LABELS[type] ??
        type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Human-readable relative time ─────────────────────────────────────────────

function relativeTime(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)     return 'Just now';
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return 'Yesterday';
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Navigation based on notification type and entity ─────────────────────────

function navigateForNotification(item: NotificationItem) {
    if (item.type === 'CHAT_MESSAGE' && item.relatedEntityId) {
        // Extract sender name from title: "New message from <Name>"
        const prefix = 'New message from ';
        const senderName = item.title.startsWith(prefix)
            ? item.title.slice(prefix.length).trim()
            : undefined;
        router.push({
            pathname: '/chat/[id]',
            params: { id: item.relatedEntityId, ...(senderName ? { name: senderName } : {}) },
        });
        return;
    }
    if (
        (item.type === 'NEW_APPLICATION' || item.type === 'APP_STATUS_CHANGE') &&
        item.relatedEntityId
    ) {
        // Workers land on their jobs feed; hirers land on their jobs list
        // The backend entity ID is the application ID — navigate to jobs feed
        // as a safe fallback since there is no dedicated applicant detail screen
        router.push('/worker/jobs-feed');
        return;
    }
    // For all other types, no navigation — just mark as read
}

// ── Single notification card ──────────────────────────────────────────────────

interface CardProps {
    item: NotificationItem;
    onPress: (item: NotificationItem) => void;
}

const NotificationCard = ({ item, onPress }: CardProps) => {
    const [expanded, setExpanded] = useState(false);
    // Show unread badge count for chat messages with more than 1 unread message
    const showBadge = item.type === 'CHAT_MESSAGE' && !item.isRead && (item.unreadCount ?? 1) > 1;
    // Use updatedAt for display time on chat notifications (reflects latest message)
    const displayTime = item.type === 'CHAT_MESSAGE' && item.updatedAt
        ? relativeTime(item.updatedAt)
        : relativeTime(item.createdAt);

    return (
        <TouchableOpacity
            style={[
                styles.card,
                item.isRead ? styles.cardRead : styles.cardUnread,
                expanded && styles.cardExpanded,
            ]}
            activeOpacity={0.8}
            onPress={() => {
                setExpanded(prev => !prev);
                if (!item.isRead) onPress(item);
            }}
        >
            {/* Unread count badge (chat threads with multiple unread messages) */}
            {showBadge ? (
                <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                </View>
            ) : (
                !item.isRead && <View style={styles.unreadDot} />
            )}

            <View style={styles.cardHeaderRow}>
                <IndianMasterIcon />

                <View style={styles.textContainer}>
                    <View style={styles.metaRow}>
                        <MaterialCommunityIcons
                            name={typeIcon(item.type)}
                            size={14}
                            color={item.isRead ? '#94A3B8' : '#DBEAFE'}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.headerText, item.isRead && styles.headerTextRead]}>
                            {typeLabel(item.type)}
                        </Text>
                        <Text style={[styles.headerText, item.isRead && styles.headerTextRead, { marginLeft: 'auto' }]}>
                            {displayTime}
                        </Text>
                    </View>

                    <Text
                        style={[styles.titleText, item.isRead && styles.titleTextRead]}
                        numberOfLines={expanded ? undefined : 1}
                    >
                        {item.title}
                    </Text>

                    {(!expanded) && (
                        <Text
                            style={[styles.subtitleText, item.isRead && styles.subtitleTextRead]}
                            numberOfLines={1}
                        >
                            {item.message}
                        </Text>
                    )}

                    {expanded && (
                        <Text style={[styles.expandedContentText, item.isRead && styles.subtitleTextRead]}>
                            {item.message}
                        </Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState(false);

    // Track AppState so we can detect foreground transitions
    const appStateRef = useRef(AppState.currentState);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setLoadError(false);
        try {
            const page = await getNotifications(1, 50);
            setNotifications(Array.isArray(page?.data) ? page.data : []);
        } catch (e) {
            console.error('[Notifications] Failed to load notifications:', e);
            setLoadError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Load on screen focus + poll every 30 s while screen is active.
    // The cleanup returned by useFocusEffect runs when the screen loses focus,
    // so the interval is always stopped when the user leaves this screen.
    useFocusEffect(useCallback(() => {
        load();
        const interval = setInterval(() => load(true), 30_000);
        return () => clearInterval(interval);
    }, [load]));

    // Silent refresh whenever the app comes back to the foreground.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (next) => {
            if (appStateRef.current.match(/inactive|background/) && next === 'active') {
                load(true);
            }
            appStateRef.current = next;
        });
        return () => sub.remove();
    }, [load]);

    const handleRefresh = () => {
        setRefreshing(true);
        setLoadError(false);
        load(true);
    };

    const handlePress = useCallback(async (item: NotificationItem) => {
        // Optimistically mark as read and reset unread count in local state
        setNotifications(prev =>
            prev.map(n => n.id === item.id ? { ...n, isRead: true, unreadCount: 0 } : n)
        );
        try {
            await markNotificationRead(item.id);
        } catch {
            // Revert on failure
            setNotifications(prev =>
                prev.map(n => n.id === item.id ? { ...n, isRead: false, unreadCount: item.unreadCount } : n)
            );
        }
        navigateForNotification(item);
    }, []);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#000000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NotificationCard item={item} onPress={handlePress} />
                    )}
                    contentContainerStyle={[
                        styles.listContent,
                        notifications.length === 0 && styles.listContentEmpty,
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3B82F6']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrap}>
                                <MaterialCommunityIcons
                                    name={loadError ? 'alert-circle-outline' : 'bell-outline'}
                                    size={48}
                                    color="#3B82F6"
                                />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {loadError ? 'Could not load notifications' : 'No notifications yet'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {loadError
                                    ? 'Check your connection and try again'
                                    : 'You\'ll see updates on jobs, applications, and messages here'
                                }
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyRefreshButton}
                                onPress={handleRefresh}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.emptyRefreshText}>
                                    {loadError ? 'Try Again' : 'Refresh'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
    },
    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    listContentEmpty: {
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 32,
    },
    emptyIconWrap: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 20,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 21,
    },
    emptyRefreshButton: {
        marginTop: 24,
        paddingHorizontal: 28,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#3B82F6',
    },
    emptyRefreshText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    // ── Card ──────────────────────────────────────────────────────────────────
    card: {
        borderRadius: 20,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    cardUnread: {
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
    },
    cardRead: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    cardExpanded: {
        borderRadius: 16,
        paddingBottom: 16,
    },
    unreadDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FCD34D',
    },
    unreadBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FCD34D',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    unreadBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1E3A8A',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    lokalIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
    },
    logoTextMain: {
        fontSize: 9,
        fontWeight: '900',
        color: '#2563EB',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        lineHeight: 11,
    },
    logoTextSub: {
        fontSize: 8,
        fontWeight: '800',
        color: '#F97316',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        lineHeight: 10,
    },
    logoBottomBar: {
        width: 14,
        height: 2,
        backgroundColor: '#2563EB',
        borderRadius: 1,
        marginTop: 1,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 2,
        marginRight: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    headerText: {
        color: '#DBEAFE',
        fontSize: 11,
        fontWeight: '500',
    },
    headerTextRead: {
        color: '#94A3B8',
    },
    titleText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 3,
        lineHeight: 20,
    },
    titleTextRead: {
        color: '#1E293B',
    },
    subtitleText: {
        fontSize: 13,
        color: '#EFF6FF',
        lineHeight: 18,
    },
    subtitleTextRead: {
        color: '#64748B',
    },
    expandedContentText: {
        fontSize: 13,
        color: '#EFF6FF',
        marginTop: 2,
        lineHeight: 20,
    },
});
