import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { COLORS, SHADOWS } from '@/constants/theme';
import { User, ChevronRight, Globe, X, Check } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Modal } from 'react-native';

export default function WorkerSettingsMenuScreen() {
    const { t, i18n } = useTranslation();
    const [langModalVisible, setLangModalVisible] = useState(false);

    const languages = [
        { code: 'en', label: 'English', native: 'English' },
        { code: 'hi', label: 'Hindi', native: 'हिंदी' },
        { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    ];

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    return (
        <View style={styles.container}>
            <AppHeader title={t('settings') || 'Settings'} showBack />

            <View style={styles.content}>
                <View style={styles.menuContainer}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/worker/help-support')}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
                                <Feather name="help-circle" size={20} color={COLORS.success} />
                            </View>
                            <Text style={styles.menuText}>{t('helpSupport')}</Text>
                        </View>
                        <ChevronRight size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setLangModalVisible(true)}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#F5F3FF' }]}>
                                <Globe size={20} color="#8B5CF6" />
                            </View>
                            <Text style={styles.menuText}>{t('language') || 'Language'}: {currentLang.label}</Text>
                        </View>
                        <ChevronRight size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Language Modal */}
            <Modal
                visible={langModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLangModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.langModalOverlay}
                    activeOpacity={1}
                    onPress={() => setLangModalVisible(false)}
                >
                    <View style={styles.langModalContent}>
                        <View style={styles.langModalHeader}>
                            <Text style={styles.langModalTitle}>{t('selectLanguage') || 'Select Language'}</Text>
                            <TouchableOpacity onPress={() => setLangModalVisible(false)} style={styles.closeBtn}>
                                <X size={24} color={COLORS.secondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.langList}>
                            {languages.map((item) => (
                                <TouchableOpacity
                                    key={item.code}
                                    style={[
                                        styles.langOption,
                                        i18n.language === item.code && styles.langOptionActive
                                    ]}
                                    onPress={() => {
                                        i18n.changeLanguage(item.code);
                                        setLangModalVisible(false);
                                    }}
                                >
                                    <View>
                                        <Text style={[
                                            styles.langLabel,
                                            i18n.language === item.code && styles.langLabelActive
                                        ]}>{item.label}</Text>
                                        <Text style={styles.langNative}>{item.native}</Text>
                                    </View>
                                    {i18n.language === item.code && (
                                        <View style={styles.checkCircle}>
                                            <Check size={16} color={COLORS.white} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
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
    menuContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.small,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
        marginLeft: 64, // Align with text start
    },
    // Language Modal Styles
    langModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    langModalContent: {
        backgroundColor: COLORS.white,
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        ...SHADOWS.medium,
    },
    langModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    langModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    closeBtn: {
        padding: 4,
    },
    langList: {
        gap: 12,
    },
    langOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    langOptionActive: {
        backgroundColor: COLORS.primary + '10',
        borderColor: COLORS.primary,
    },
    langLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    langLabelActive: {
        color: COLORS.primary,
    },
    langNative: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
