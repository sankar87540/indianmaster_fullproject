import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, SHADOWS } from '@/constants/theme';
import FadeInView from '@/components/FadeInView';
import { useTranslation } from 'react-i18next';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { saveProfileData, getProfileData } from '@/utils/storage';
import { StatusBar } from 'expo-status-bar';

export default function EducatedWorkerSetup() {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadData = async () => {
            const data = await getProfileData();
            if (data) {
                if (data.fullName) setFullName(data.fullName);
                if (data.age) setAge(data.age);
                if (data.mobileNumber) setMobileNumber(data.mobileNumber);
                if (data.email) setEmail(data.email);
                if (data.gender) setGender(data.gender);
                if (data.address) setAddress(data.address);
            }
        };
        loadData();
    }, []);

    const genderOptions = [
        { label: t('male') || 'Male', value: 'Male' },
        { label: t('female') || 'Female', value: 'Female' },
        { label: t('other') || 'Other', value: 'Other' },
    ];

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!age.trim()) newErrors.age = 'Age is required';
        if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) newErrors.mobileNumber = 'Valid 10-digit number required';
        if (email && !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email required';
        if (!gender) newErrors.gender = 'Gender is required';
        if (!address.trim()) newErrors.address = 'Location is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = async () => {
        if (!validateForm()) return;

        await saveProfileData({
            fullName,
            age,
            mobileNumber,
            email,
            gender,
            address,
            isEducated: true,
        });

        router.push('/worker/profile-setup');
    };

    const isFormValid = fullName.trim() && age.trim() && /^\d{10}$/.test(mobileNumber) && gender && address.trim();

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
                            <Text style={styles.vibrantTitle}>{t('personalDetails') || 'Personal Details'}</Text>
                            <Text style={styles.vibrantSubtitle}>{t('personalDetailsSubtitle') || 'Please fill your personal details to continue'}</Text>
                        </View>
                        <View style={styles.heroIconBox}>
                            <Feather name="user" size={45} color="rgba(255,255,255,0.2)" />
                        </View>
                    </View>
                </View>

                <FadeInView style={[styles.floatingWorkspace, isDesktop && styles.desktopContent]}>
                    <View style={styles.islandSurface}>
                        <View style={styles.islandSection}>
                            {/* Full Name */}
                            <View style={styles.vibrantInputRow}>
                                <Text style={styles.modernLabel}>{t('fullName')} <Text style={styles.required}>*</Text></Text>
                                <View style={[styles.vibrantInputBox, errors.fullName && styles.inputError]}>
                                    <Feather name="user" size={22} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.modernTextInput}
                                        placeholder={t('fullNamePlaceholder') || "Enter your full name"}
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

                            {/* Age */}
                            <View style={styles.vibrantInputRow}>
                                <Text style={styles.modernLabel}>{t('age') || 'Age'} <Text style={styles.required}>*</Text></Text>
                                <View style={[styles.vibrantInputBox, errors.age && styles.inputError]}>
                                    <MaterialCommunityIcons name="calendar" size={22} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.modernTextInput}
                                        placeholder={t('agePlaceholder') || "Enter your age"}
                                        placeholderTextColor={COLORS.textLight}
                                        value={age}
                                        onChangeText={(text) => {
                                            setAge(text.replace(/[^0-9]/g, ''));
                                            if (errors.age) setErrors(prev => ({ ...prev, age: '' }));
                                        }}
                                        keyboardType="numeric"
                                        maxLength={2}
                                    />
                                </View>
                                {errors.age && <Text style={styles.vibrantError}>{errors.age}</Text>}
                            </View>

                            {/* Mobile Number */}
                            <View style={styles.vibrantInputRow}>
                                <Text style={styles.modernLabel}>{t('mobileNumber')} <Text style={styles.required}>*</Text></Text>
                                <View style={[styles.vibrantInputBox, errors.mobileNumber && styles.inputError]}>
                                    <Feather name="phone" size={22} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.modernTextInput}
                                        placeholder="10-digit mobile number"
                                        placeholderTextColor={COLORS.textLight}
                                        value={mobileNumber}
                                        onChangeText={(text) => {
                                            setMobileNumber(text.replace(/[^0-9]/g, '').slice(0, 10));
                                            if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: '' }));
                                        }}
                                        keyboardType="numeric"
                                        maxLength={10}
                                    />
                                </View>
                                {errors.mobileNumber && <Text style={styles.vibrantError}>{errors.mobileNumber}</Text>}
                            </View>

                            {/* Email ID */}
                            <View style={styles.vibrantInputRow}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={styles.modernLabel}>{t('email') || 'Email ID'}</Text>
                                    <Text style={[styles.modernLabel, { color: COLORS.textLight, fontWeight: 'normal' }]}>Optional</Text>
                                </View>
                                <View style={[styles.vibrantInputBox, errors.email && styles.inputError]}>
                                    <Feather name="mail" size={22} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.modernTextInput}
                                        placeholder="Enter your email ID"
                                        placeholderTextColor={COLORS.textLight}
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                {errors.email && <Text style={styles.vibrantError}>{errors.email}</Text>}
                            </View>

                            {/* Gender */}
                            <View style={styles.vibrantInputRow}>
                                <Text style={styles.modernLabel}>{t('gender') || 'Gender'} <Text style={styles.required}>*</Text></Text>
                                <View style={{ zIndex: 10 }}>
                                    <TouchableOpacity
                                        style={[styles.vibrantSelectBox, isGenderDropdownOpen && styles.dropdownTriggerOpen]}
                                        onPress={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.vibrantSelectLeft}>
                                            <View style={styles.vibrantIconCircle}>
                                                <Ionicons name="male-female" size={20} color={COLORS.primary} />
                                            </View>
                                            <Text style={[styles.vibrantSelectText, !gender && styles.placeholderText]}>
                                                {gender || 'Select Gender'}
                                            </Text>
                                        </View>
                                        <Feather name={isGenderDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>

                                    {isGenderDropdownOpen && (
                                        <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                                            {genderOptions.map((opt, index) => {
                                                const isSelected = gender === opt.value;
                                                return (
                                                    <TouchableOpacity
                                                        key={opt.value}
                                                        style={[
                                                            styles.dropdownItem,
                                                            index !== genderOptions.length - 1 && styles.dropdownItemBorder,
                                                            isSelected && styles.dropdownItemSelected
                                                        ]}
                                                        onPress={() => {
                                                            setGender(opt.value);
                                                            setIsGenderDropdownOpen(false);
                                                            if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                                                        }}
                                                    >
                                                        <Text style={[
                                                            styles.dropdownItemText,
                                                            isSelected && styles.dropdownItemTextSelected
                                                        ]}>
                                                            {opt.label}
                                                        </Text>
                                                        {isSelected && <Feather name="check" size={16} color={COLORS.primary} />}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    )}
                                </View>
                                {errors.gender && <Text style={styles.vibrantError}>{errors.gender}</Text>}
                            </View>

                            {/* Location / Address */}
                            <View style={styles.vibrantInputRow}>
                                <Text style={styles.modernLabel}>{t('address') || 'Location'} <Text style={styles.required}>*</Text></Text>
                                <View style={[styles.vibrantInputBox, errors.address && styles.inputError]}>
                                    <Feather name="map-pin" size={22} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.modernTextInput}
                                        placeholder={t('addressPlaceholderProfile') || "Enter your location"}
                                        placeholderTextColor={COLORS.textLight}
                                        value={address}
                                        onChangeText={(text) => {
                                            setAddress(text);
                                            if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                                        }}
                                        multiline
                                    />
                                </View>
                                {errors.address && <Text style={styles.vibrantError}>{errors.address}</Text>}
                            </View>
                        </View>
                    </View>
                    <View style={{ height: 160 }} />
                </FadeInView>
            </ScrollView>

            <View style={styles.footer}>
                <PrimaryButton
                    title={t('continue')}
                    onPress={handleContinue}
                    disabled={!isFormValid}
                />
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
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: '#F1F5F9',
    },
    chipSelected: {
        backgroundColor: COLORS.primary + '10',
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    chipTextSelected: {
        color: COLORS.primary,
        fontWeight: '800',
    },
    vibrantSelectBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: '#F1F5F9',
    },
    vibrantSelectLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    vibrantIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.small,
    },
    vibrantSelectText: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '800',
    },
    placeholderText: {
        color: COLORS.textLight,
    },
    dropdownTriggerOpen: {
        borderColor: COLORS.primary,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    dropdownList: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderTopWidth: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: COLORS.white,
        maxHeight: 250,
        overflow: 'hidden',
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    dropdownItemSelected: {
        backgroundColor: COLORS.primaryLight,
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#1E293B',
    },
    dropdownItemTextSelected: {
        color: COLORS.primary,
        fontWeight: '600',
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
});
