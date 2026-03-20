import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FadeInView from '@/components/FadeInView';
import { StatusBar } from 'expo-status-bar';

export default function EducationTypeScreen() {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const handleSelection = (type: 'educated' | 'uneducated') => {
        if (type === 'educated') {
            router.push('/worker/educated-setup' as any);
        } else {
            router.push('/worker/uneducated-setup' as any);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <AppHeader showBack showLanguage={true} showCallSupport={true} />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    <View style={styles.textSection}>
                        <Text style={styles.title}>{t('educationTypeTitle') || 'Help us understand your education'}</Text>
                        <Text style={styles.subtitle}>
                            {t('educationTypeSubtitle') || 'Please select your education status to help us find the right jobs for you.'}
                        </Text>
                    </View>

                    <FadeInView style={[styles.optionsContainer, isDesktop && styles.desktopOptions]}>
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => handleSelection('educated')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconWrapper, { backgroundColor: '#E0F2FE' }]}>
                                <MaterialCommunityIcons name="school" size={40} color="#0369A1" />
                            </View>
                            <View style={styles.optionTextContent}>
                                <Text style={styles.optionTitle}>{t('educated') || '🎓 Educated Background'}</Text>
                                <Text style={styles.optionDesc}>
                                    {t('educatedDesc') || 'I have completed some level of schooling or college.'}
                                </Text>
                            </View>
                            <View style={styles.arrowIcon}>
                                <Text style={styles.arrowText}>→</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => handleSelection('uneducated')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
                                <MaterialCommunityIcons name="account-off" size={40} color="#B45309" />
                            </View>
                            <View style={styles.optionTextContent}>
                                <Text style={styles.optionTitle}>{t('uneducated') || '🛠 Non-Educated Background'}</Text>
                                <Text style={styles.optionDesc}>
                                    {t('uneducatedDesc') || 'I have not had formal schooling or prefer manual work.'}
                                </Text>
                            </View>
                            <View style={styles.arrowIcon}>
                                <Text style={styles.arrowText}>→</Text>
                            </View>
                        </TouchableOpacity>
                    </FadeInView>
                    <View style={{ height: 40 }} />
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
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    textSection: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 24,
    },
    optionsContainer: {
        gap: 20,
    },
    desktopOptions: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
    },
    optionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    optionTextContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    optionDesc: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    arrowIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    arrowText: {
        fontSize: 18,
        color: '#9CA3AF',
        fontWeight: '600',
    },
});
