import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Animated, Modal, Alert, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Send, Phone, Menu, Check } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { getChatMessages, sendChatMessage, markThreadAsRead } from '@/services/workerService';
import { getUserId } from '@/utils/storage';

export default function ChatDetailScreen() {
    const { id, name, image } = useLocalSearchParams();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [message, setMessage] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    type LocalMessage = { id: string; text: string; sender: 'me' | 'other'; time: string };
    const [messages, setMessages] = useState<LocalMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [sending, setSending] = useState(false);

    const formatMsgTime = (dateStr: string): string =>
        new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    useEffect(() => {
        const loadMessages = async () => {
            const uid = await getUserId();
            try {
                const result = await getChatMessages(id as string, 1, 50);
                const mapped: LocalMessage[] = result.data.map((m) => ({
                    id: m.id,
                    text: m.messageText,
                    sender: m.senderId === uid ? 'me' : 'other',
                    time: formatMsgTime(m.createdAt),
                }));
                setMessages(mapped);
                // Mark all messages from the other party as read
                markThreadAsRead(id as string).catch(() => {/* fire-and-forget */});
            } catch {
                // leave messages empty; user can still send
            } finally {
                setLoadingMessages(false);
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
            }
        };
        loadMessages();
    }, [id]);

    const handleCall = () => {
        if (isBlocked) {
            Alert.alert('Blocked', 'You cannot call a blocked user.');
            return;
        }
        Linking.openURL('tel:919876543210');
    };

    const handleSend = async () => {
        if (message.trim() === '' || sending) return;

        const optimisticId = Date.now().toString();
        const optimistic: LocalMessage = {
            id: optimisticId,
            text: message.trim(),
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, optimistic]);
        setMessage('');
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        setSending(true);
        try {
            const sent = await sendChatMessage(id as string, optimistic.text);
            // Replace optimistic entry with confirmed server message
            setMessages(prev => prev.map(m =>
                m.id === optimisticId
                    ? { ...m, id: sent.id, time: formatMsgTime(sent.createdAt) }
                    : m
            ));
        } catch {
            // Keep optimistic message visible; do not remove on failure
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
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
                        <Text style={styles.headerName}>{name || 'Chat User'}</Text>
                        <Text style={[styles.headerStatus, isBlocked && { color: COLORS.error }]}>
                            {isBlocked ? 'Blocked' : 'Online'}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.actionIcon} onPress={handleCall}>
                        <MaterialCommunityIcons
                            name={isMuted ? "bell-off" : "phone"}
                            size={20}
                            color={isMuted ? COLORS.textLight : COLORS.primary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => setMenuVisible(true)}>
                        <Menu size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages List */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
                {loadingMessages ? (
                    <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
                ) : messages.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: COLORS.textLight, marginTop: 40 }}>No messages yet. Say hi!</Text>
                ) : null}
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        style={[
                            styles.messageWrapper,
                            msg.sender === 'me' ? styles.myMessageWrapper : styles.otherMessageWrapper
                        ]}
                    >
                        <View
                            style={[
                                styles.messageBubble,
                                msg.sender === 'me' ? styles.myBubble : styles.otherBubble
                            ]}
                        >
                            <Text style={[
                                styles.messageText,
                                msg.sender === 'me' ? styles.myMessageText : styles.otherMessageText
                            ]}>
                                {msg.text}
                            </Text>
                            <View style={styles.messageFooter}>
                                <Text style={styles.messageTime}>{msg.time}</Text>
                                {msg.sender === 'me' && (
                                    <Check size={14} color="#DBEAFE" style={{ marginLeft: 4 }} />
                                )}
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder={isBlocked ? "You have blocked this user" : "Type a message..."}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            editable={!isBlocked}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (message.trim() === '' || isBlocked || sending) && styles.sendButtonDisabled
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
            </KeyboardAvoidingView>

            {/* Options Menu Modal */}
            <Modal
                transparent={true}
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
                                    params: {
                                        id: id as string,
                                        name: name as string,
                                        image: image as string,
                                        role: 'Chef'
                                    }
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
                                Alert.alert(isMuted ? 'Unmuted' : 'Muted', isMuted ? 'Notifications restored' : 'Notifications muted');
                            }}
                        >
                            <MaterialCommunityIcons
                                name={isMuted ? "bell-outline" : "bell-off-outline"}
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
                                    { text: 'Clear', style: 'destructive', onPress: () => setMessages([]) }
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
                                Alert.alert(nextState ? 'Block User' : 'Unblock User', `Are you sure you want to ${nextState ? 'block' : 'unblock'} ${name}?`, [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: nextState ? 'Block' : 'Unblock', style: 'destructive', onPress: () => setIsBlocked(nextState) }
                                ]);
                            }}
                        >
                            <MaterialCommunityIcons name={isBlocked ? "lock-open-outline" : "block-helper"} size={20} color={COLORS.error} />
                            <Text style={[styles.menuOptionText, { color: COLORS.error }]}>{isBlocked ? 'Unblock User' : 'Block User'}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
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
        color: COLORS.success,
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
        paddingBottom: 24,
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
    myBubbleTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingTop: 10,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
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
    // --- Menu Styles ---
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
