import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Image, Animated, PanResponder,
    Modal, Alert, Linking, ActivityIndicator, AppState,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Send, Menu, Check, X } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import {
    getChatMessages, sendChatMessage, markThreadAsRead, getThreadPresence,
} from '@/services/workerService';
import { getUserId } from '@/utils/storage';
import { chatSocket } from '@/services/chatSocketService';

type LocalMessage = {
    id: string;
    text: string;
    sender: 'me' | 'other';
    time: string;
    // Tick status (sender messages only)
    deliveredAt: string | null;
    isRead: boolean;
    // Quoted reply context
    replyToId: string | null;
    replyToText: string | null;
    replyToSender: 'me' | 'other' | null;
};
type ReplyTarget = { id: string; text: string; sender: 'me' | 'other' } | null;

// How far the user must drag right to trigger reply
const REPLY_THRESHOLD = 60;

// ─── Tick icon for message delivery/read status ──────────────────────────────
// single tick  = sent (server accepted, recipient hasn't synced yet)
// double tick  = delivered (recipient's app fetched the messages)
// blue double  = read (recipient opened and viewed the thread)
function MessageTick({ msg }: { msg: LocalMessage }) {
    if (msg.sender !== 'me') return null;
    if (msg.isRead) {
        // Read: bright white — maximum contrast on the blue (#2563EB) bubble.
        // Pure white is visually distinct from the dimmer sent/delivered ticks,
        // making read status immediately obvious without blending into the bubble.
        return <MaterialCommunityIcons name="check-all" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />;
    }
    if (msg.deliveredAt) {
        // Delivered: semi-transparent white — clearly visible but dimmer than read.
        return <MaterialCommunityIcons name="check-all" size={16} color="rgba(255,255,255,0.55)" style={{ marginLeft: 4 }} />;
    }
    // Sent: same muted white for single tick — visually consistent with delivered.
    return <Check size={14} color="rgba(255,255,255,0.55)" style={{ marginLeft: 4 }} />;
}

// ─── Per-message row with swipe-to-reply ─────────────────────────────────────
// Uses React Native's built-in PanResponder (no extra library needed).
//
// Android fix: when a horizontal swipe is detected, we call onScrollEnable(false)
// to prevent the parent ScrollView from intercepting the gesture. The ScrollView
// is re-enabled immediately on release/terminate.
//
// Both onScrollEnable and onReply are stable setState references — no stale
// closure issue even though PanResponder is created once via useRef.
function MessageItem({
    msg,
    chatName,
    onReply,
    onScrollEnable,
    onLayout,
    onReplyTap,
}: {
    msg: LocalMessage;
    chatName: string;
    onReply: (msg: LocalMessage) => void;
    onScrollEnable: (enabled: boolean) => void;
    onLayout: (id: string, y: number) => void;
    onReplyTap: (replyToId: string) => void;
}) {
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            // Only claim when horizontal movement clearly dominates
            onMoveShouldSetPanResponder: (_, gs) => {
                if (Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2) {
                    // Disable ScrollView scrolling so it doesn't steal the gesture on Android
                    onScrollEnable(false);
                    return true;
                }
                return false;
            },
            onPanResponderMove: (_, gs) => {
                // Only allow rightward slide, capped at 80px
                if (gs.dx > 0) {
                    translateX.setValue(Math.min(gs.dx, 80));
                }
            },
            onPanResponderRelease: (_, gs) => {
                onScrollEnable(true);
                if (gs.dx >= REPLY_THRESHOLD) {
                    onReply(msg);
                }
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 120,
                    friction: 8,
                }).start();
            },
            onPanResponderTerminate: () => {
                onScrollEnable(true);
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            },
        })
    ).current;

    // Quoted reply text shown inside the bubble
    const replyPreviewText =
        msg.replyToText ?? (msg.replyToId ? 'Message deleted' : null);
    const replyPreviewSender =
        msg.replyToSender === 'me' ? 'You' : chatName;

    return (
        <Animated.View
            onLayout={(e) => onLayout(msg.id, e.nativeEvent.layout.y)}
            style={[
                styles.messageWrapper,
                msg.sender === 'me' ? styles.myMessageWrapper : styles.otherMessageWrapper,
                { transform: [{ translateX }] },
            ]}
            {...panResponder.panHandlers}
        >
            <View style={[styles.messageBubble, msg.sender === 'me' ? styles.myBubble : styles.otherBubble]}>
                {/* Quoted reply block — only shown when this message is a reply */}
                {msg.replyToId && replyPreviewText !== null && (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => onReplyTap(msg.replyToId!)}
                        style={[
                            styles.quotedReply,
                            msg.sender === 'me' ? styles.quotedReplyMe : styles.quotedReplyOther,
                        ]}
                    >
                        <View style={[
                            styles.quotedReplyBar,
                            msg.sender === 'me' ? styles.quotedReplyBarMe : styles.quotedReplyBarOther,
                        ]} />
                        <View style={styles.quotedReplyContent}>
                            <Text style={[
                                styles.quotedReplySender,
                                msg.sender === 'me' ? styles.quotedReplySenderMe : styles.quotedReplySenderOther,
                            ]}>
                                {replyPreviewSender}
                            </Text>
                            <Text
                                style={[
                                    styles.quotedReplyText,
                                    msg.sender === 'me' ? styles.quotedReplyTextMe : styles.quotedReplyTextOther,
                                ]}
                                numberOfLines={1}
                            >
                                {replyPreviewText}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                <Text style={[
                    styles.messageText,
                    msg.sender === 'me' ? styles.myMessageText : styles.otherMessageText,
                ]}>
                    {msg.text}
                </Text>
                <View style={styles.messageFooter}>
                    <Text style={[styles.messageTime, msg.sender === 'other' && styles.otherMessageTime]}>
                        {msg.time}
                    </Text>
                    <MessageTick msg={msg} />
                </View>
            </View>
        </Animated.View>
    );
}

// ─── Main chat screen ─────────────────────────────────────────────────────────
export default function ChatDetailScreen() {
    // Type the params so `id` is always string, never string[].
    // Without the generic, Expo Router types it as string | string[], which makes
    // useCallback([id]) produce a new function reference on every render, causing
    // useEffect to re-run fetchMessages(true) and wipe optimistic messages.
    const { id: rawId, name, image } = useLocalSearchParams<{ id: string; name?: string; image?: string }>();
    const id = rawId as string;
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const [message, setMessage] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [replyTo, setReplyTo] = useState<ReplyTarget>(null);

    // ScrollView scroll control — disabled during horizontal message swipe on Android
    const [scrollEnabled, setScrollEnabled] = useState(true);

    // Presence state: null = loading/unknown, true = online, false = offline
    const [presenceOnline, setPresenceOnline] = useState<boolean | null>(null);

    const scrollViewRef = useRef<ScrollView>(null);
    const [messages, setMessages] = useState<LocalMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [sending, setSending] = useState(false);
    const currentUserIdRef = useRef<string | null>(null);
    const knownIdsRef = useRef<Set<string>>(new Set());
    // Guard: ensure the initial full-replace only fires once per mount, even if
    // useEffect re-runs (e.g. React StrictMode double-invoke in dev).
    const initialLoadDoneRef = useRef(false);
    const appStateRef = useRef(AppState.currentState);
    // Always points to the latest fetchMessages so the interval never holds a stale closure.
    const fetchMessagesRef = useRef<((isInitial: boolean) => Promise<void>) | null>(null);
    // Tracks the y offset of each message row (used by scroll-to-reply).
    const messageYOffsetRef = useRef<Map<string, number>>(new Map());

    const formatMsgTime = (dateStr: string): string =>
        new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // ── Message fetching ────────────────────────────────────────────────────────
    const fetchMessages = useCallback(async (isInitial: boolean) => {
        const uid = currentUserIdRef.current ?? await getUserId();
        if (!currentUserIdRef.current) currentUserIdRef.current = uid;
        try {
            const result = await getChatMessages(id, 1, 50);
            // Backend returns newest-first (DESC). Reverse so display is oldest→newest.
            const incoming: LocalMessage[] = result.data.slice().reverse().map((m) => {
                const senderSide: 'me' | 'other' = m.senderId === uid ? 'me' : 'other';
                const replyToSenderSide: 'me' | 'other' | null =
                    m.replyToSenderId == null
                        ? null
                        : m.replyToSenderId === uid ? 'me' : 'other';
                return {
                    id: m.id,
                    text: m.messageText,
                    sender: senderSide,
                    time: formatMsgTime(m.createdAt),
                    deliveredAt: m.deliveredAt ?? null,
                    isRead: m.isRead,
                    replyToId: m.replyToMessageId ?? null,
                    replyToText: m.replyToText ?? null,
                    replyToSender: replyToSenderSide,
                };
            });
            if (isInitial && !initialLoadDoneRef.current) {
                initialLoadDoneRef.current = true;
                knownIdsRef.current = new Set(incoming.map((m) => m.id));
                setMessages(incoming);
                markThreadAsRead(id).catch(() => {});
            } else {
                // Full-replace on every poll so the list always reflects server state.
                // knownIdsRef tells us whether there are genuinely new messages (for scroll/read).
                const hasNew = incoming.some((m) => !knownIdsRef.current.has(m.id));
                // Resync knownIds to match the current server window.
                knownIdsRef.current = new Set(incoming.map((m) => m.id));
                setMessages((prev) => {
                    // Preserve any in-flight optimistic messages (outgoing, not yet confirmed).
                    const optimistic = prev.filter((m) => m.id.startsWith('optimistic-'));
                    return [...incoming, ...optimistic];
                });
                if (hasNew) {
                    markThreadAsRead(id).catch(() => {});
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                }
            }
        } catch {
            // keep existing messages on error
        }
    }, [id]);

    // Keep the ref pointing at the latest fetchMessages on every render.
    // The polling useEffect below uses this ref so the interval never needs to restart
    // even if fetchMessages gets a new reference (avoids poll-timer resets on state changes).
    fetchMessagesRef.current = fetchMessages;

    // ── Focus-triggered refresh ─────────────────────────────────────────────────
    // Fires an immediate silent poll whenever this screen regains focus — covers the
    // case where the user navigated to another in-app screen (e.g. notifications) and
    // then came back. The interval alone misses this because it may have just ticked
    // and the next tick is up to 3 s away. The guard skips the initial mount focus
    // (handled by the useEffect below) to avoid a double initial fetch.
    useFocusEffect(useCallback(() => {
        if (initialLoadDoneRef.current) {
            fetchMessagesRef.current?.(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])); // empty deps — always accesses latest values via refs

    useEffect(() => {
        fetchMessagesRef.current!(true).finally(() => {
            setLoadingMessages(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
        });

        // ── WebSocket real-time updates ────────────────────────────────────────
        // Connect the shared socket (idempotent) and subscribe to this thread.
        // Events arrive instantly — no polling delay.
        chatSocket.connect();
        chatSocket.subscribeThread(id);

        const removeWSHandler = chatSocket.addHandler((event) => {
            if (event.type !== 'new_message' && event.type !== 'message_read') return;
            if (event.thread_id !== id) return;
            // Refresh from REST to get authoritative server state
            // (delivery/read status, reply previews, etc.)
            fetchMessagesRef.current!(false);
        });

        // ── Fallback poll ──────────────────────────────────────────────────────
        // Only fires when the WebSocket is not connected (e.g. first reconnect
        // after a network drop). 30 s is a safe backstop; WS handles real-time.
        const fallbackPoll = setInterval(() => {
            if (!chatSocket.isConnected) {
                fetchMessagesRef.current!(false);
            }
        }, 30_000);

        return () => {
            removeWSHandler();
            chatSocket.unsubscribeThread(id);
            clearInterval(fallbackPoll);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount — always calls latest via refs

    // ── Presence polling ────────────────────────────────────────────────────────
    // Poll every 30 seconds. Uses the thread ID only — no extra params needed.
    // Backend derives who "other" is from the thread + caller JWT.
    useEffect(() => {
        const fetchPresence = async () => {
            try {
                const p = await getThreadPresence(id);
                setPresenceOnline(p.isOnline);
            } catch {
                // non-fatal: keep showing whatever state we have
            }
        };
        fetchPresence();
        const presenceInterval = setInterval(fetchPresence, 30_000);
        return () => clearInterval(presenceInterval);
    }, [id]);

    // ── AppState foreground refresh ─────────────────────────────────────────────
    // When the app comes back from background/inactive, do a silent poll
    // immediately so new messages appear without waiting for the next poll tick.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (next) => {
            if (appStateRef.current.match(/inactive|background/) && next === 'active') {
                fetchMessagesRef.current?.(false);
            }
            appStateRef.current = next;
        });
        return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once — always calls latest via ref

    // ── Handlers ────────────────────────────────────────────────────────────────
    const handleCall = () => {
        if (isBlocked) {
            Alert.alert('Blocked', 'You cannot call a blocked user.');
            return;
        }
        Linking.openURL('tel:919876543210');
    };

    // Scroll to a specific message by its ID (used by tap on quoted reply).
    // Fails gracefully if the message is not in the current loaded window.
    const scrollToMessage = useCallback((msgId: string) => {
        const y = messageYOffsetRef.current.get(msgId);
        if (y !== undefined) {
            scrollViewRef.current?.scrollTo({ y, animated: true });
        }
        // Silently do nothing if the message is not currently loaded.
    }, []);

    const handleLayoutMessage = useCallback((msgId: string, y: number) => {
        messageYOffsetRef.current.set(msgId, y);
    }, []);

    const handleSend = async () => {
        if (message.trim() === '' || sending) return;

        const textToSend = message.trim();
        const replyTarget = replyTo; // snapshot before clearing state
        const optimisticId = `optimistic-${Date.now()}`;
        const optimistic: LocalMessage = {
            id: optimisticId,
            text: textToSend,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            deliveredAt: null,
            isRead: false,
            replyToId: replyTarget?.id ?? null,
            replyToText: replyTarget?.text ?? null,
            replyToSender: replyTarget?.sender ?? null,
        };
        setMessages(prev => [...prev, optimistic]);
        setMessage('');
        setReplyTo(null);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        setSending(true);
        try {
            const sent = await sendChatMessage(id, textToSend, replyTarget?.id ?? undefined);
            knownIdsRef.current.add(sent.id);
            setMessages(prev => prev.map(m =>
                m.id === optimisticId
                    ? {
                        ...m,
                        id: sent.id,
                        time: formatMsgTime(sent.createdAt),
                        replyToId: sent.replyToMessageId ?? null,
                        replyToText: sent.replyToText ?? null,
                    }
                    : m
            ));
        } catch (err: any) {
            console.error('[Chat] sendChatMessage failed:', err?.message ?? err);
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            Alert.alert('Send failed', err?.message ?? 'Could not send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const chatName = (name as string) || 'Chat User';

    // Presence label for the header
    const presenceLabel = isBlocked
        ? 'Blocked'
        : presenceOnline === null
            ? '...'
            : presenceOnline
                ? 'Online'
                : 'Offline';

    const presenceColor = isBlocked
        ? COLORS.error
        : presenceOnline
            ? COLORS.success
            : COLORS.textSecondary;

    // ── Render ──────────────────────────────────────────────────────────────────
    // Keyboard fix:
    //   - KAV is the SINGLE root element (no Fragment wrapper).
    //     Without this, KAV's internal findNodeHandle measurement can be confused
    //     by expo-router's screen host container on Android.
    //   - behavior='padding' for BOTH platforms: KAV adds paddingBottom = keyboard
    //     height, shrinking the flex-1 ScrollView and keeping the input visible.
    //     (Avoids the LayoutAnimation conflicts of 'height' on Android.)
    //   - keyboardVerticalOffset=0: KAV is at y=0 of the screen; safe-area is
    //     handled inside the header via insets.top.
    //   - Modal lives inside KAV: Modals are native portals and overlay the full
    //     screen regardless of where they sit in the React tree.
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={0}
        >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Image
                        source={{ uri: (image as string) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=100' }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.headerName}>{chatName}</Text>
                        <Text style={[styles.headerStatus, { color: presenceColor }]}>
                            {presenceLabel}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.actionIcon} onPress={handleCall}>
                        <MaterialCommunityIcons
                            name={isMuted ? 'bell-off' : 'phone'}
                            size={20}
                            color={isMuted ? COLORS.textLight : COLORS.primary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => setMenuVisible(true)}>
                        <Menu size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Messages list ──────────────────────────────────────────── */}
            {/* scrollEnabled is toggled false during horizontal message swipe
                so Android's ScrollView doesn't steal the gesture. */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                scrollEnabled={scrollEnabled}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
                {loadingMessages ? (
                    <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
                ) : messages.length === 0 ? (
                    <Text style={styles.emptyText}>No messages yet. Say hi!</Text>
                ) : null}

                {messages.map((msg) => (
                    <MessageItem
                        key={msg.id}
                        msg={msg}
                        chatName={chatName}
                        onReply={setReplyTo}
                        onScrollEnable={setScrollEnabled}
                        onLayout={handleLayoutMessage}
                        onReplyTap={scrollToMessage}
                    />
                ))}
            </ScrollView>

            {/* ── Input area (reply preview + composer) ──────────────────── */}
            <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
                {/* Reply preview strip */}
                {replyTo && (
                    <View style={styles.replyPreview}>
                        <View style={styles.replyAccent} />
                        <View style={styles.replyBody}>
                            <Text style={styles.replyLabel}>
                                {replyTo.sender === 'me' ? 'Replying to yourself' : `Replying to ${chatName}`}
                            </Text>
                            <Text style={styles.replyText} numberOfLines={1}>
                                {replyTo.text}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setReplyTo(null)}
                            style={styles.replyClose}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <X size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder={isBlocked ? 'You have blocked this user' : 'Type a message...'}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        editable={!isBlocked}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (message.trim() === '' || isBlocked || sending) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={message.trim() === '' || isBlocked || sending}
                    >
                        {sending
                            ? <ActivityIndicator size="small" color={COLORS.white} />
                            : <Send size={20} color={COLORS.white} />}
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Options menu modal ─────────────────────────────────────── */}
            {/* Modal renders as a native portal — position in tree doesn't matter */}
            <Modal
                transparent
                visible={menuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={[styles.menuDropdown, { top: insets.top + 60 }]}>
                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => {
                                setMenuVisible(false);
                                router.push({
                                    pathname: '/profile/[id]',
                                    params: { id: id as string, name: name as string, image: image as string, role: 'Chef' },
                                });
                            }}
                        >
                            <MaterialCommunityIcons name="account-circle-outline" size={20} color={COLORS.text} />
                            <Text style={styles.menuOptionText}>View Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => {
                                setMenuVisible(false);
                                setIsMuted(!isMuted);
                                Alert.alert(
                                    isMuted ? 'Unmuted' : 'Muted',
                                    isMuted ? 'Notifications restored' : 'Notifications muted',
                                );
                            }}
                        >
                            <MaterialCommunityIcons
                                name={isMuted ? 'bell-outline' : 'bell-off-outline'}
                                size={20}
                                color={COLORS.text}
                            />
                            <Text style={styles.menuOptionText}>{isMuted ? 'Unmute' : 'Mute'} Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => {
                                setMenuVisible(false);
                                Alert.alert('Clear Chat', 'Are you sure you want to clear this conversation?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Clear', style: 'destructive', onPress: () => setMessages([]) },
                                ]);
                            }}
                        >
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.error} />
                            <Text style={[styles.menuOptionText, { color: COLORS.error }]}>Clear Chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuOption, { borderBottomWidth: 0 }]}
                            onPress={() => {
                                setMenuVisible(false);
                                const nextState = !isBlocked;
                                Alert.alert(
                                    nextState ? 'Block User' : 'Unblock User',
                                    `Are you sure you want to ${nextState ? 'block' : 'unblock'} ${chatName}?`,
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: nextState ? 'Block' : 'Unblock',
                                            style: 'destructive',
                                            onPress: () => setIsBlocked(nextState),
                                        },
                                    ]
                                );
                            }}
                        >
                            <MaterialCommunityIcons
                                name={isBlocked ? 'lock-open-outline' : 'block-helper'}
                                size={20}
                                color={COLORS.error}
                            />
                            <Text style={[styles.menuOptionText, { color: COLORS.error }]}>
                                {isBlocked ? 'Unblock User' : 'Block User'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: COLORS.white,
        ...SHADOWS.small,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#F1F5F9',
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerStatus: {
        fontSize: 12,
        fontWeight: '600',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        padding: 8,
        marginLeft: 4,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: 40,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 16,
        width: '100%',
    },
    myMessageWrapper: {
        justifyContent: 'flex-end',
    },
    otherMessageWrapper: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 18,
        ...SHADOWS.small,
    },
    myBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: COLORS.white,
    },
    otherMessageText: {
        color: COLORS.text,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    messageTime: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
    },
    otherMessageTime: {
        color: 'rgba(0,0,0,0.4)',
    },
    // ── Quoted reply block inside a bubble ──────────────────────────────────────
    quotedReply: {
        flexDirection: 'row',
        borderRadius: 8,
        marginBottom: 6,
        overflow: 'hidden',
    },
    quotedReplyMe: {
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    quotedReplyOther: {
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    quotedReplyBar: {
        width: 3,
        alignSelf: 'stretch',
    },
    quotedReplyBarMe: {
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    quotedReplyBarOther: {
        backgroundColor: COLORS.primary,
    },
    quotedReplyContent: {
        flex: 1,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    quotedReplySender: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 1,
    },
    quotedReplySenderMe: {
        color: 'rgba(255,255,255,0.85)',
    },
    quotedReplySenderOther: {
        color: COLORS.primary,
    },
    quotedReplyText: {
        fontSize: 12,
    },
    quotedReplyTextMe: {
        color: 'rgba(255,255,255,0.7)',
    },
    quotedReplyTextOther: {
        color: COLORS.textSecondary,
    },
    // ── Input area ──────────────────────────────────────────────────────────────
    inputContainer: {
        paddingHorizontal: 16,
        paddingTop: 10,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    // ── Reply preview ───────────────────────────────────────────────────────────
    replyPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        marginBottom: 8,
        overflow: 'hidden',
    },
    replyAccent: {
        width: 3,
        alignSelf: 'stretch',
        backgroundColor: COLORS.primary,
    },
    replyBody: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    replyLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 2,
    },
    replyText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    replyClose: {
        padding: 10,
    },
    // ── Composer ────────────────────────────────────────────────────────────────
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F1F5F9',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        paddingTop: 8,
        paddingBottom: 8,
        paddingHorizontal: 12,
        fontSize: 15,
        color: COLORS.text,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    sendButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    // ── Menu modal ──────────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    menuDropdown: {
        position: 'absolute',
        right: 16,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        width: 200,
        ...SHADOWS.medium,
        zIndex: 100,
        overflow: 'hidden',
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    menuOptionText: {
        fontSize: 15,
        color: COLORS.text,
        marginLeft: 12,
        fontWeight: '500',
    },
});
