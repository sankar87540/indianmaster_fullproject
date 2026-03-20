import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Linking, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { COLORS, SHADOWS } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { Mail, Phone, MessageCircle, X, Send, Bot } from 'lucide-react-native';

const FAQ_DATA = [
    {
        id: '1',
        question: 'How do I post a job?',
        answer: 'Go to the "Jobs" tab and click on the "+ Create New" button. Fill in the details about the role, salary, and location to start getting applicants.'
    },
    {
        id: '2',
        question: 'How do I contact a worker?',
        answer: 'Click on "Contact Worker" on any worker\'s profile. You may need a subscription plan to view full contact details like phone numbers.'
    },
    {
        id: '3',
        question: 'How safe is my data?',
        answer: 'We take data privacy seriously. Your personal information is encrypted and never shared without your consent. We comply with all data protection regulations.'
    },
    {
        id: '4',
        question: 'What is the refund policy?',
        answer: 'Refunds are processed within 5-7 business days for eligible cases. Please contact support@indianmaster.in for specific refund requests.'
    }
];

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
};

import { useTranslation } from 'react-i18next';

export default function HelpSupportScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const [chatVisible, setChatVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleEmailSupport = () => {
        Linking.openURL('mailto:support@indianmaster.in');
    };

    const handleCallSupport = () => {
        Linking.openURL('tel:+919876543210');
    };

    const handleWhatsAppSupport = () => {
        Linking.openURL('whatsapp://send?phone=+919876543210&text=Hi, I need help with the Indian Master app.');
    };

    const fetchOpenAIResponse = async (userText: string) => {
        // Client-side OpenAI key usage removed for security.
        // Always use safe local fallback responses from frontend.
        return getLocalFallbackResponse(userText);
    };

    // Keep the local logic as a robust fallback!
    const getLocalFallbackResponse = (text: string): string => {
        const lowerText = text.toLowerCase();
        let language = 'english';
        if (text.match(/[\u0B80-\u0BFF]/)) language = 'tamil';
        else if (lowerText.match(/(panna|venum|iruka|epadi|saptia|machan|ji|start|aama|illa)/)) language = 'tanglish';

        if (lowerText.includes('job') || lowerText.includes('velai')) {
            if (language === 'tamil') return "வேலை பதிவு செய்ய 'Jobs' பக்கம் செல்லவும்.";
            if (language === 'tanglish') return "Job post panna 'Jobs' tab ponga. '+ Create New' click pannunga.";
            return "To post a job, go to the 'Jobs' tab and click '+ Create New'.";
        }
        if (lowerText.includes('contact') || lowerText.includes('worker') || lowerText.includes('number')) {
            if (language === 'tamil') return "பணியாளர்களை தொடர்பு கொள்ள சந்தா (Subscription) தேவை.";
            if (language === 'tanglish') return "Workers contact panna, 'Subscription' venum. Profile la 'Contact' click pannunga.";
            return "To contact workers, click 'Contact Worker' on their profile. You may need a plan.";
        }
        if (language === 'tanglish') return "Puriyala ji. 'Job' or 'Worker' pathi kelunga.";
        if (language === 'tamil') return "மன்னிக்கவும். வேலை அல்லது பணியாளர்கள் பற்றி கேட்கவும்.";
        return "I can help with Jobs, Workers, and Subscriptions. What do you need?";
    };

    const openChatWithFAQ = (question: string, answer: string) => {
        setChatVisible(true);
        setMessages([
            { id: '1', text: question, sender: 'user', timestamp: new Date() }
        ]);
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [
                ...prev,
                { id: '2', text: answer, sender: 'ai', timestamp: new Date() }
            ]);
        }, 1000);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userText = inputText;
        const newUserMsg: Message = {
            id: Date.now().toString(),
            text: userText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        setIsTyping(true);

        // Fetch Response (Real or Fallback)
        const responseText = await fetchOpenAIResponse(userText);

        setIsTyping(false);
        const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: responseText,
            sender: 'ai',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
    };

    const openGeneralChat = () => {
        setChatVisible(true);
        setMessages([
            { id: '1', text: "Hello! I'm the Indian Master AI. Ask me anything!", sender: 'ai', timestamp: new Date() }
        ]);
    }

    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages, isTyping]);

    return (
        <View style={styles.container}>
            <AppHeader title={t('helpSupport')} showBack={true} />

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                <View style={styles.headerSection}>
                    <Text style={styles.mainTitle}>{t('howCanWeHelp') || 'How can we help you?'}</Text>
                    <Text style={styles.subtitle}>{t('helpSubtitle') || 'We are here to assist you with any questions or issues you may have.'}</Text>
                </View>

                {/* Contact Options */}
                <View style={styles.contactOptions}>
                    <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport}>
                        <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                            <Phone size={24} color="#0284C7" />
                        </View>
                        <Text style={styles.contactTitle}>{t('callUs') || 'Call Us'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FCE7F3' }]}>
                            <Mail size={24} color="#DB2777" />
                        </View>
                        <Text style={styles.contactTitle}>{t('emailUs') || 'Email Us'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactCard} onPress={handleWhatsAppSupport}>
                        <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
                            <MessageCircle size={24} color="#16A34A" />
                        </View>
                        <Text style={styles.contactTitle}>WhatsApp</Text>
                    </TouchableOpacity>
                </View>

                {/* AI Banner */}
                <View style={styles.aiBanner}>
                    <View style={styles.aiTextContainer}>
                        <Text style={styles.aiTitle}>{t('genericQuestion') || 'Have a generic question?'}</Text>
                        <Text style={styles.aiSubtitle}>{t('chatWithAI') || 'Chat with our AI Assistant'}</Text>
                    </View>
                    <TouchableOpacity style={styles.aiButton} onPress={openGeneralChat}>
                        <Bot size={20} color="#fff" />
                        <Text style={styles.aiButtonText}>{t('chatNow') || 'Chat Now'}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>{t('faqTitle') || 'Frequently Asked Questions'}</Text>
                {FAQ_DATA.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.faqCard}
                        onPress={() => openChatWithFAQ(item.question, item.answer)}
                    >
                        <Text style={styles.faqQuestion}>{item.question}</Text>
                        <Text style={styles.faqTapHint}>{t('tapToAskAI') || 'Tap to ask AI'}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>


            {/* Chat Modal */}
            <Modal
                visible={chatVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setChatVisible(false)}
            >
                <View style={styles.chatContainer}>
                    <View style={styles.chatHeader}>
                        <View style={styles.chatHeaderInfo}>
                            <View style={styles.botAvatar}><Bot size={20} color="#fff" /></View>
                            <View>
                                <Text style={styles.chatHeaderTitle}>Indian Master AI</Text>
                                <Text style={styles.chatHeaderSubtitle}>{isTyping ? 'Typing...' : 'Always here to help'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.closeButton}>
                            <X size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.messagesList}
                        renderItem={({ item }) => (
                            <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                                <Text style={[styles.messageText, item.sender === 'user' ? styles.userText : styles.aiText]}>{item.text}</Text>
                            </View>
                        )}
                        ListFooterComponent={isTyping ? (
                            <View style={[styles.messageBubble, styles.aiBubble, { width: 60, alignItems: 'center' }]}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            </View>
                        ) : null}
                    />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                        style={styles.inputContainer}
                    >
                        <TextInput
                            style={styles.input}
                            placeholder="Type your message..."
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                            <Send size={20} color="#fff" />
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    // ... (Keep existing styles, just refined slightly for brevity in this replace)
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    headerSection: { marginBottom: 24, alignItems: 'center' },
    mainTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
    contactOptions: { marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between' },
    contactCard: { flex: 1, alignItems: 'center', backgroundColor: COLORS.white, padding: 12, borderRadius: 12, marginHorizontal: 4, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
    iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    contactTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
    aiBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EEF2FF', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#C7D2FE' },
    aiTextContainer: { flex: 1 },
    aiTitle: { fontSize: 14, fontWeight: '600', color: '#4338CA' },
    aiSubtitle: { fontSize: 12, color: '#6366F1' },
    aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 6 },
    aiButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
    faqCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
    faqQuestion: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
    faqTapHint: { fontSize: 12, color: COLORS.primary, fontStyle: 'italic' },
    chatContainer: { flex: 1, backgroundColor: '#F3F4F6' },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    botAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
    chatHeaderTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    chatHeaderSubtitle: { fontSize: 12, color: COLORS.success },
    closeButton: { padding: 4 },
    messagesList: { padding: 20, gap: 16 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 4 },
    userBubble: { backgroundColor: '#4F46E5', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: COLORS.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.borderLight },
    messageText: { fontSize: 15, lineHeight: 22 },
    userText: { color: '#fff' },
    aiText: { color: COLORS.text },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
    input: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: COLORS.borderLight },
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
});
