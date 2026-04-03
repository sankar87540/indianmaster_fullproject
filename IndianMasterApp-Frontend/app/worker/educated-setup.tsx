import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, useWindowDimensions, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { INDIAN_STATES, getCitiesForState } from '@/constants/indianStateCities';
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
    const [dobDay, setDobDay] = useState('');
    const [dobMonth, setDobMonth] = useState('');
    const [dobYear, setDobYear] = useState('');
    const [isDobPickerOpen, setIsDobPickerOpen] = useState(false);
    const defaultPickerDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 25); return d; })();
    const [dobPickerDate, setDobPickerDate] = useState<Date>(defaultPickerDate);
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const [stateSearch, setStateSearch] = useState('');
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);

    const DOB_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentYear = new Date().getFullYear();

    const calculatedAge = (() => {
        if (!dobDay || !dobMonth || !dobYear) return '';
        const d = parseInt(dobDay), m = parseInt(dobMonth), y = parseInt(dobYear);
        const dob = new Date(y, m - 1, d);
        if (isNaN(dob.getTime()) || dob.getMonth() !== m - 1) return '';
        const today = new Date();
        let a = today.getFullYear() - dob.getFullYear();
        const md = today.getMonth() - dob.getMonth();
        if (md < 0 || (md === 0 && today.getDate() < dob.getDate())) a--;
        return (a > 0 && a < 120) ? String(a) : '';
    })();

    const dobDisplayText = (() => {
        if (!dobDay || !dobMonth || !dobYear) return '';
        return `${dobDay} ${DOB_MONTHS[parseInt(dobMonth) - 1]} ${dobYear}`;
    })();

    const handleDateChange = (_event: any, selectedDate?: Date) => {
        // On Android the native dialog closes itself; hide our open flag too.
        if (Platform.OS === 'android') setIsDobPickerOpen(false);
        if (selectedDate) {
            setDobPickerDate(selectedDate);
            setDobDay(String(selectedDate.getDate()).padStart(2, '0'));
            setDobMonth(String(selectedDate.getMonth() + 1).padStart(2, '0'));
            setDobYear(String(selectedDate.getFullYear()));
            setErrors(prev => ({ ...prev, age: '' }));
        }
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadData = async () => {
            const data = await getProfileData();
            if (data) {
                if (data.fullName) setFullName(data.fullName);
                if (data.dobDay) setDobDay(data.dobDay);
                if (data.dobMonth) setDobMonth(data.dobMonth);
                if (data.dobYear) setDobYear(data.dobYear);
                if (data.dobDay && data.dobMonth && data.dobYear) {
                    const restored = new Date(parseInt(data.dobYear), parseInt(data.dobMonth) - 1, parseInt(data.dobDay));
                    if (!isNaN(restored.getTime())) setDobPickerDate(restored);
                }
                if (data.mobileNumber) setMobileNumber(data.mobileNumber);
                if (data.email) setEmail(data.email);
                if (data.gender) setGender(data.gender);
                if (data.address) setAddress(data.address);
                if (data.city) setCity(data.city);
                if (data.state) setState(data.state);
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
        if (!calculatedAge) newErrors.age = 'Valid date of birth is required';
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
            dobDay,
            dobMonth,
            dobYear,
            age: calculatedAge,
            mobileNumber,
            email,
            gender,
            address,
            city,
            state,
            isEducated: true,
        });

        router.push('/worker/profile-setup');
    };

    const isFormValid = fullName.trim() && !!calculatedAge && /^\d{10}$/.test(mobileNumber) && gender && address.trim();

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

                            {/* Date of Birth → Age */}
                            <View style={styles.vibrantInputRow}>
                                <Text style={styles.modernLabel}>{t('dateOfBirth') || 'Date of Birth'} <Text style={styles.required}>*</Text></Text>
                                <TouchableOpacity
                                    style={[styles.vibrantSelectBox, errors.age && styles.inputError]}
                                    onPress={() => {
                                        setIsDobPickerOpen(true);
                                        if (errors.age) setErrors(prev => ({ ...prev, age: '' }));
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.vibrantSelectLeft}>
                                        <View style={styles.vibrantIconCircle}>
                                            <MaterialCommunityIcons name="calendar" size={20} color={COLORS.primary} />
                                        </View>
                                        <Text style={[styles.vibrantSelectText, !dobDisplayText && styles.placeholderText]}>
                                            {dobDisplayText || (t('dobPlaceholder') || 'Select date of birth')}
                                        </Text>
                                    </View>
                                    <Feather name="chevron-down" size={20} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                                {!!calculatedAge && (
                                    <Text style={{ marginTop: 6, marginLeft: 12, fontSize: 13, color: COLORS.primary, fontWeight: '700' }}>
                                        Age: {calculatedAge} years
                                    </Text>
                                )}
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
                                <Text style={styles.modernLabel}>{t('address') || 'Address'} <Text style={styles.required}>*</Text></Text>
                                <View style={[styles.vibrantInputBox, { borderColor: '#CBD5E1', minHeight: 90, alignItems: 'flex-start', paddingVertical: 14 }, errors.address && styles.inputError]}>
                                    <TextInput
                                        style={[styles.modernTextInput, { marginLeft: 0, textAlignVertical: 'top' }]}
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

                            {/* State */}
                            <View style={styles.vibrantInputRow}>
                                <Text style={styles.modernLabel}>{t('state') || 'State'}</Text>
                                <TouchableOpacity
                                    style={[styles.vibrantSelectBox, { minHeight: 50 }]}
                                    onPress={() => { setStateSearch(''); setIsStateDropdownOpen(true); }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.modernTextInput, { flex: 1, color: state ? COLORS.text : COLORS.textLight }]} numberOfLines={1}>
                                        {state || (t('statePlaceholder') || 'Select State')}
                                    </Text>
                                    <Feather name="chevron-down" size={18} color={COLORS.textLight} />
                                </TouchableOpacity>
                            </View>

                            {/* City */}
                            <View style={styles.vibrantInputRow}>
                                <Text style={styles.modernLabel}>{t('city') || 'City'}</Text>
                                <TouchableOpacity
                                    style={[styles.vibrantSelectBox, { minHeight: 50, opacity: state ? 1 : 0.5 }]}
                                    onPress={() => {
                                        if (!state) return;
                                        setCitySearch('');
                                        setIsCityDropdownOpen(true);
                                    }}
                                    activeOpacity={state ? 0.8 : 1}
                                >
                                    <Text style={[styles.modernTextInput, { flex: 1, color: city ? COLORS.text : COLORS.textLight }]} numberOfLines={1}>
                                        {city || (state ? (t('cityPlaceholder') || 'Select City') : (t('selectStateFirst') || 'Select State first'))}
                                    </Text>
                                    <Feather name="chevron-down" size={18} color={COLORS.textLight} />
                                </TouchableOpacity>
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

            {/* DOB Date Picker — native platform picker */}
            {isDobPickerOpen && Platform.OS === 'android' && (
                <DateTimePicker
                    value={dobPickerDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date(currentYear - 15, 11, 31)}
                    minimumDate={new Date(currentYear - 85, 0, 1)}
                />
            )}
            <Modal
                visible={isDobPickerOpen && Platform.OS === 'ios'}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsDobPickerOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.dobPickerSheet}>
                        <View style={styles.dobPickerSheetHeader}>
                            <Text style={styles.modalTitle}>{t('dateOfBirth') || 'Date of Birth'}</Text>
                            <TouchableOpacity onPress={() => setIsDobPickerOpen(false)}>
                                <Text style={styles.dobPickerDoneText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={dobPickerDate}
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                            maximumDate={new Date(currentYear - 15, 11, 31)}
                            minimumDate={new Date(currentYear - 85, 0, 1)}
                            style={{ width: '100%' }}
                        />
                    </View>
                </View>
            </Modal>

            {/* State Dropdown Modal */}
            <Modal
                visible={isStateDropdownOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => { setIsStateDropdownOpen(false); setStateSearch(''); }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{t('state') || 'State'}</Text>
                                <Text style={styles.modalSubtitle}>{state || (t('noneSelected') || 'None selected')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => { setIsStateDropdownOpen(false); setStateSearch(''); }} style={styles.closeButton}>
                                <Feather name="x" size={24} color={COLORS.secondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalSearchContainer}>
                            <Feather name="search" size={16} color={COLORS.textLight} style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder={t('searchState') || 'Search state...'}
                                placeholderTextColor={COLORS.textLight}
                                value={stateSearch}
                                onChangeText={setStateSearch}
                                autoFocus
                            />
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {INDIAN_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 && (
                                <Text style={{ textAlign: 'center', color: COLORS.textLight, padding: 24 }}>
                                    {t('noStateFound') || 'No state found'}
                                </Text>
                            )}
                            {INDIAN_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map((stateName) => {
                                const isSelected = state === stateName;
                                return (
                                    <TouchableOpacity
                                        key={stateName}
                                        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                                        onPress={() => {
                                            setState(stateName);
                                            const newCities = getCitiesForState(stateName);
                                            if (city && !newCities.includes(city)) setCity('');
                                            setIsStateDropdownOpen(false);
                                        }}
                                    >
                                        <View style={styles.dropdownItemContent}>
                                            <View style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: 11,
                                                borderWidth: 2,
                                                borderColor: isSelected ? COLORS.primary : COLORS.border,
                                                backgroundColor: isSelected ? COLORS.primary : 'transparent',
                                                marginRight: 12,
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {isSelected && <Feather name="check" size={14} color={COLORS.white} />}
                                            </View>
                                            <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                                                {stateName}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* City Dropdown Modal */}
            <Modal
                visible={isCityDropdownOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => { setIsCityDropdownOpen(false); setCitySearch(''); }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{t('city') || 'City'}</Text>
                                <Text style={styles.modalSubtitle}>{state}</Text>
                            </View>
                            <TouchableOpacity onPress={() => { setIsCityDropdownOpen(false); setCitySearch(''); }} style={styles.closeButton}>
                                <Feather name="x" size={24} color={COLORS.secondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalSearchContainer}>
                            <Feather name="search" size={16} color={COLORS.textLight} style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder={t('searchCity') || 'Search city...'}
                                placeholderTextColor={COLORS.textLight}
                                value={citySearch}
                                onChangeText={setCitySearch}
                                autoFocus
                            />
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {getCitiesForState(state).filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).length === 0 && (
                                <Text style={{ textAlign: 'center', color: COLORS.textLight, padding: 24 }}>
                                    {t('noCityFound') || 'No city found'}
                                </Text>
                            )}
                            {getCitiesForState(state)
                                .filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
                                .map((cityName) => {
                                    const isSelected = city === cityName;
                                    return (
                                        <TouchableOpacity
                                            key={cityName}
                                            style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                                            onPress={() => {
                                                setCity(cityName);
                                                setIsCityDropdownOpen(false);
                                            }}
                                        >
                                            <View style={styles.dropdownItemContent}>
                                                <View style={{
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: 11,
                                                    borderWidth: 2,
                                                    borderColor: isSelected ? COLORS.primary : COLORS.border,
                                                    backgroundColor: isSelected ? COLORS.primary : 'transparent',
                                                    marginRight: 12,
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {isSelected && <Feather name="check" size={14} color={COLORS.white} />}
                                                </View>
                                                <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                                                    {cityName}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    dobPickerSheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingBottom: 32,
    },
    dobPickerSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    dobPickerDoneText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.secondary,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F3F4F6',
        margin: 16,
        borderRadius: 16,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.secondary,
        marginLeft: 8,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 4,
    },
    modalItemSelected: {
        backgroundColor: COLORS.primaryLight,
    },
    modalItemText: {
        fontSize: 16,
        color: COLORS.secondary,
        fontWeight: '600',
    },
    modalItemTextSelected: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    dropdownItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
});
