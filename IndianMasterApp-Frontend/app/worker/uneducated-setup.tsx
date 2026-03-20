import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, useWindowDimensions, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import PrimaryButton from '@/components/PrimaryButton';
import ProgressIndicator from '@/components/ProgressIndicator';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import FadeInView from '@/components/FadeInView';
import { useTranslation } from 'react-i18next';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { saveProfileData } from '@/utils/storage';
import { StatusBar } from 'expo-status-bar';
import { createWorkerProfile, updateWorkerProfile, updateUserProfile } from '@/services/workerService';
import { mapToWorkerProfilePayload } from '@/utils/workerProfileMapper';
import { ApiError } from '@/services/apiClient';

export default function UneducatedWorkerSetup() {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [fullName, setFullName] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [city, setCity] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const handleContinue = async () => {
        const profileData = {
            fullName,
            city,
            selectedRoles: selectedRole ? [selectedRole] : [],
            isEducated: false,
        };

        await saveProfileData(profileData);

        setLoading(true);
        setApiError('');
        try {
            const payload = mapToWorkerProfilePayload({
                city,
                selectedRoles: selectedRole ? [selectedRole] : [],
                isEducated: false,
            });
            try {
                await createWorkerProfile(payload);
            } catch (createErr: any) {
                // If profile already exists (HTTP 409 or 500 duplicate), fall back to update
                if (createErr instanceof ApiError && (createErr.statusCode === 409 || createErr.statusCode === 500)) {
                    await updateWorkerProfile(payload);
                } else {
                    throw createErr;
                }
            }
            // Save fullName to the user profile (separate from worker profile)
            if (fullName.trim()) {
                try { await updateUserProfile({ fullName: fullName.trim() }); } catch (_) {}
            }
            router.push('/worker/jobs-feed');
        } catch (e: any) {
            setApiError(e?.message ?? 'Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Name is required';
        } else if (fullName.trim().length < 3) {
            newErrors.fullName = 'Name must be at least 3 characters';
        }

        if (!city.trim()) {
            newErrors.city = 'City is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = fullName.trim().length >= 3 && city.trim().length > 0;

    const handleContinueAction = async () => {
        if (validateForm()) {
            await handleContinue();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: COLORS.white }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <StatusBar style="light" />
            <AppHeader showBack showLanguage={true} showCallSupport={true} />

            <ScrollView
                style={{ flex: 1, backgroundColor: '#F3F4F6' }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.vibrantHeader}>
                    <View style={styles.headerHero}>
                        <View style={styles.heroTextBox}>
                            <Text style={styles.vibrantTitle}>{t('uneducatedSetupTitle') || '🛠 Non-Educated Background'}</Text>
                            <Text style={styles.vibrantSubtitle}>{t('uneducatedSetupSubtitle') || 'Tell us about yourself to find manual or skill-based work'}</Text>
                        </View>
                        <View style={styles.heroIconBox}>
                            <Feather name="user" size={50} color="rgba(255,255,255,0.2)" />
                        </View>
                    </View>
                </View>

                <FadeInView style={[styles.floatingWorkspace, isDesktop && styles.desktopContent]}>
                    <View style={styles.islandSurface}>
                        <View style={styles.islandSection}>
                            <View style={styles.sectionHeading}>
                                <View style={[styles.accentRing, { borderColor: COLORS.primary }]} />
                                <Text style={styles.islandSectionTitle}>{t('basicDetails') || 'Basic Information'}</Text>
                            </View>

                            <View style={styles.vibrantInputRow}>
                                <Text style={styles.modernLabel}>{t('fullName')} <Text style={styles.required}>*</Text></Text>
                                <View style={[styles.vibrantInputBox, errors.fullName && styles.inputError]}>
                                    <Feather name="user" size={22} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.modernTextInput}
                                        placeholder="Enter your full name"
                                        placeholderTextColor={COLORS.textLight}
                                        value={fullName}
                                        onChangeText={(text) => {
                                            setFullName(text);
                                            if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                                        }}
                                    />
                                </View>
                                {errors.fullName && <Text style={styles.vibrantError}>{errors.fullName}</Text>}
                            </View>



                            <View style={styles.vibrantInputRow}>
                                <View style={styles.labelRowWithBadge}>
                                    <Text style={[styles.modernLabel, { flex: 1 }]}>{t('preferredRole') || 'Work You Can Do'}</Text>
                                    <View style={styles.vibrantBadge}><Text style={styles.vibrantBadgeText}>Optional</Text></View>
                                </View>
                                <View style={styles.vibrantInputBox}>
                                    <Feather name="tool" size={22} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.modernTextInput}
                                        placeholder={t('preferredRolePlaceholder') || "e.g. Helper, Cleaner, Cook"}
                                        placeholderTextColor={COLORS.textLight}
                                        value={selectedRole}
                                        onChangeText={setSelectedRole}
                                    />
                                </View>
                            </View>

                            <View style={styles.vibrantInputRow}>
                                <Text style={styles.modernLabel}>{t('city')} <Text style={styles.required}>*</Text></Text>
                                <View style={[styles.vibrantInputBox, errors.city && styles.inputError]}>
                                    <MaterialCommunityIcons name="map-marker-outline" size={22} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.modernTextInput}
                                        placeholder={t('cityPlaceholder') || "e.g. Salem"}
                                        placeholderTextColor={COLORS.textLight}
                                        value={city}
                                        onChangeText={(text) => {
                                            setCity(text);
                                            if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                                        }}
                                    />
                                </View>
                                {errors.city && <Text style={styles.vibrantError}>{errors.city}</Text>}
                            </View>
                        </View>
                    </View>
                    <View style={{ height: 160 }} />
                </FadeInView>
            </ScrollView>

            <View style={styles.footer}>
                {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}
                {loading ? (
                    <ActivityIndicator color={COLORS.primary} />
                ) : (
                    <PrimaryButton
                        title={t('continue')}
                        onPress={handleContinueAction}
                        disabled={!isFormValid}
                    />
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    vibrantHeader: {
        backgroundColor: COLORS.primary,
        paddingTop: Platform.OS === 'ios' ? 10 : 16,
        paddingHorizontal: 24,
        paddingBottom: 80,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
    },
    headerHero: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
    },
    heroTextBox: {
        flex: 1,
    },
    vibrantTitle: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
        lineHeight: 32,
    },
    vibrantSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 6,
        lineHeight: 20,
        fontWeight: '500',
    },
    heroIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingWorkspace: {
        marginTop: -40,
        paddingHorizontal: 20,
    },
    desktopContent: {
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },
    islandSurface: {
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
        paddingVertical: 10,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    islandSection: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    sectionHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    accentRing: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 3,
    },
    islandSectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.secondary,
        flex: 1,
        lineHeight: 24,
    },
    vibrantInputRow: {
        marginBottom: 20,
    },
    modernLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginBottom: 10,
        marginLeft: 4,
    },
    vibrantInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        paddingHorizontal: 20,
        minHeight: 60,
        paddingVertical: 10,
        borderWidth: 2,
        borderColor: '#F1F5F9',
    },
    modernTextInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.secondary,
        fontWeight: '600',
        marginLeft: 14,
    },
    labelRowWithBadge: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vibrantBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    vibrantBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    vibrantError: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
        marginLeft: 12,
    },
    inputError: {
        borderColor: '#EF4444' + '40',
        backgroundColor: '#EF4444' + '05',
    },
    required: {
        color: '#EF4444',
    },
    footer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 25,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    apiError: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
});
