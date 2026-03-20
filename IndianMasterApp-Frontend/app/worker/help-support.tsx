import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import AppHeader from '@/components/AppHeader';
import { COLORS, SHADOWS } from '@/constants/theme';
import { Phone, Mail, MessageCircle } from 'lucide-react-native';

export default function HelpSupportScreen() {
    return (
        <View style={styles.container}>
            <AppHeader title="Help & Support" showBack />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Contact Support</Text>
                    <Text style={styles.cardSubtitle}>
                        We are here to help you with any issues or questions.
                    </Text>

                    <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('tel:+919876543210')}>
                        <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                            <Phone size={20} color={COLORS.primary} />
                        </View>
                        <View style={styles.contactTextContainer}>
                            <Text style={styles.contactLabel}>Call Us</Text>
                            <Text style={styles.contactValue}>+91 98765 43210</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('mailto:support@indianmaster.com')}>
                        <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                            <Mail size={20} color={COLORS.success} />
                        </View>
                        <View style={styles.contactTextContainer}>
                            <Text style={styles.contactLabel}>Email Us</Text>
                            <Text style={styles.contactValue}>support@indianmaster.com</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('https://wa.me/919876543210')}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FFF7ED' }]}>
                            <MessageCircle size={20} color="#F97316" />
                        </View>
                        <View style={styles.contactTextContainer}>
                            <Text style={styles.contactLabel}>WhatsApp</Text>
                            <Text style={styles.contactValue}>+91 98765 43210</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, { marginTop: 20 }]}>
                    <Text style={styles.cardTitle}>FAQs</Text>
                    {['How to apply for a job?', 'How to update my profile?', 'Payment related queries'].map((faq, index) => (
                        <View key={index} style={styles.faqItem}>
                            <Text style={styles.faqQuestion}>{faq}</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.small,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 20,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    contactTextContainer: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
        marginVertical: 12,
        marginLeft: 56,
    },
    faqItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    faqQuestion: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    }
});
