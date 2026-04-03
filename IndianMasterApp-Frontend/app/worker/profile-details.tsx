import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, SHADOWS } from '@/constants/theme';
import { getProfileData, saveProfileData } from '@/utils/storage';
import { User, Phone, Briefcase, Star, Lock, Mail, MapPin, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getWorkerProfile, updateWorkerProfile, updateUserProfile } from '@/services/workerService';
import * as Location from 'expo-location';
import { ApiError } from '@/services/apiClient';
import { mapToWorkerProfilePayload } from '@/utils/workerProfileMapper';

export default function WorkerProfileDetailsScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [education, setEducation] = useState('');
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [experience, setExperience] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [gender, setGender] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const profile = await getWorkerProfile();
                if (profile.fullName) setFullName(profile.fullName);
                // Strip +91 prefix so the 10-digit validation still works
                if (profile.phoneNumber) setMobileNumber(profile.phoneNumber.replace(/^\+91/, ''));
                if (profile.educationLevel) setEducation(profile.educationLevel);
                if (profile.aadhaarNumber) setAadhaarNumber(profile.aadhaarNumber);
                if (profile.experienceYears) setExperience(profile.experienceYears.toString());
                if (profile.city) setCity(profile.city);
                if (profile.state) setState(profile.state);
                if (profile.address) setAddress(profile.address);
                if (profile.gender) setGender(profile.gender);
                // email is not in the worker profile response — load from AsyncStorage
                const local = await getProfileData();
                if (local?.email) setEmail(local.email);
            } catch (e) {
                if (e instanceof ApiError && e.statusCode === 401) {
                    // Expired/invalid token — do not show stale data, force re-login
                    Alert.alert('Session Expired', 'Please log in again.', [
                        { text: 'OK', onPress: () => router.replace('/') },
                    ]);
                    return;
                }
                // 404 = profile not created yet; 500+ = server error → AsyncStorage best-effort
                const data = await getProfileData();
                if (data) {
                    if (data.fullName) setFullName(data.fullName);
                    if (data.mobileNumber) setMobileNumber(data.mobileNumber);
                    if (data.education) setEducation(data.education);
                    if (data.aadhaarNumber) setAadhaarNumber(data.aadhaarNumber);
                    if (data.selectedExperience && data.selectedExperience[0]) {
                        setExperience(data.selectedExperience[0]);
                    } else if (data.experience) {
                        setExperience(data.experience);
                    }
                    if (data.city) setCity(data.city);
                    if (data.state) setState(data.state);
                    if (data.address) setAddress(data.address);
                    if (data.email) setEmail(data.email);
                    if (data.gender) setGender(data.gender);
                }
            }
        };
        loadData();
    }, []);

    const handleSave = async () => {
        if (!fullName || mobileNumber.length !== 10) {
            Alert.alert('Error', 'Please enter valid Full Name and 10-digit Mobile Number');
            return;
        }

        // Keep AsyncStorage in sync (preserves existing local flow)
        await saveProfileData({
            fullName,
            mobileNumber,
            education,
            aadhaarNumber,
            experience,
            city,
            state,
            address,
            email,
            gender,
            selectedExperience: [experience],
        });

        setSaveLoading(true);
        setApiError('');
        try {
            // Sync identity fields to the users table
            const userUpdate: { email?: string; fullName?: string } = {};
            if (email) userUpdate.email = email;
            if (fullName.trim()) userUpdate.fullName = fullName.trim();
            if (Object.keys(userUpdate).length > 0) {
                await updateUserProfile(userUpdate);
            }
            // education state holds the free-text qualification string;
            // the mapper expects it under educationLevel
            // Silently attempt device GPS (requires expo-location). Non-fatal if unavailable.
            let gpsLat: number | undefined;
            let gpsLon: number | undefined;
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    gpsLat = pos.coords.latitude;
                    gpsLon = pos.coords.longitude;
                }
            } catch { /* permission denied or GPS unavailable */ }

            const payload = mapToWorkerProfilePayload({
                fullName,
                mobileNumber,
                educationLevel: education,
                aadhaarNumber,
                experience,
                city,
                state,
                address,
                gender,
                liveLatitude: gpsLat,
                liveLongitude: gpsLon,
            });
            await updateWorkerProfile(payload);
            Alert.alert('Success', 'Profile details updated successfully');
            router.back();
        } catch (e: any) {
            setApiError(e?.message ?? 'Failed to update profile. Please try again.');
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <AppHeader title="Profile Details" showBack />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Basic Details</Text>
                    <Text style={styles.sectionSubtitle}>Personal Information</Text>
                </View>

                <View style={styles.formCard}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <User size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Edit Name"
                            />
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.genderContainer}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.genderOptions}>
                            {['Male', 'Female', 'Other'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.genderOption, gender === option && styles.genderOptionSelected]}
                                    onPress={() => setGender(option)}
                                >
                                    <Text style={[styles.genderText, gender === option && styles.genderTextSelected]}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('address') || 'Address'}</Text>
                        <View style={styles.inputWrapper}>
                            <MapPin size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={address}
                                onChangeText={setAddress}
                                placeholder={t('addressPlaceholder') || "House No, Street Name"}
                            />
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>{t('city') || 'City'}</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={city}
                                    onChangeText={setCity}
                                    placeholder={t('cityPlaceholder') || "City"}
                                />
                            </View>
                        </View>
                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>{t('state') || 'State'}</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={state}
                                    onChangeText={setState}
                                    placeholder={t('statePlaceholder') || "State"}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Contact Info</Text>
                </View>

                <View style={styles.formCard}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('mobileNumber') || 'Mobile Number'}</Text>
                        <View style={styles.inputWrapper}>
                            <Phone size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={mobileNumber}
                                onChangeText={setMobileNumber}
                                placeholder={t('enterMobile') || "Edit Mobile Number"}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('email') || 'Email ID'}</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="example@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Professional Info</Text>
                </View>

                <View style={styles.formCard}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Experience (Years)</Text>
                        <View style={styles.inputWrapper}>
                            <Briefcase size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={experience}
                                onChangeText={setExperience}
                                placeholder="e.g. 2"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Education</Text>
                        <View style={styles.inputWrapper}>
                            <Star size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={education}
                                onChangeText={setEducation}
                                placeholder="Add Education Details"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Digital Locker</Text>
                    <Text style={styles.sectionSubtitle}>Government ID & Verification</Text>
                </View>

                <View style={styles.formCard}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Aadhaar Number</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color={COLORS.primary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={aadhaarNumber}
                                onChangeText={setAadhaarNumber}
                                placeholder="Enter Aadhaar Number"
                                keyboardType="numeric"
                                maxLength={12}
                            />
                        </View>
                        <Text style={styles.helperText}>Stored securely in your digital locker.</Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Links</Text>
                </View>

                <TouchableOpacity
                    style={[styles.formCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                    onPress={() => router.push({ pathname: '/worker/jobs-feed', params: { initialTab: 'saved' } })}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.inputIcon, { backgroundColor: '#FFF7ED', padding: 8, borderRadius: 8 }]}>
                            <Star size={20} color={COLORS.primary} fill={COLORS.primary} />
                        </View>
                        <Text style={[styles.label, { marginBottom: 0, marginLeft: 10 }]}>My Saved Jobs</Text>
                    </View>
                    <ChevronRight size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

            </ScrollView>

            <View style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, 20) }
            ]}>
                {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}
                {saveLoading ? (
                    <ActivityIndicator color={COLORS.primary} />
                ) : (
                    <PrimaryButton title="Save Changes" onPress={handleSave} />
                )}
            </View>
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
    sectionHeader: {
        marginBottom: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.small,
    },
    inputContainer: {
        marginVertical: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
        marginVertical: 16,
    },
    helperText: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 6,
        marginLeft: 4,
    },
    footer: {
        padding: 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },
    apiError: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    genderContainer: {
        marginTop: 8,
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    genderOption: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    genderOptionSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    genderText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    genderTextSelected: {
        color: COLORS.white,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
