import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView, useWindowDimensions, Alert, Keyboard, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { BedDouble, Store, Utensils, Users } from 'lucide-react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileData } from '@/utils/storage';
import { getHirerProfile, upsertHirerProfile } from '@/services/workerService';
import * as Location from 'expo-location';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import FadeInView from '@/components/FadeInView';
import { useTranslation } from 'react-i18next';
import ProgressIndicator from '@/components/ProgressIndicator';
import AppHeader from '@/components/AppHeader';


const CookieIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cookie" size={size} color={color} />;

export default function RestaurantSetupScreen() {
  const { t } = useTranslation();
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactRole, setContactRole] = useState<'Owner' | 'Manager' | ''>('Owner');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [fssaiLicense, setFssaiLicense] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [employeeCount, setEmployeeCount] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [businessSearch, setBusinessSearch] = useState('');
  const [restaurantImage, setRestaurantImage] = useState<any>(null);
  // const [city, setCity] = useState('');
  // const [state, setState] = useState('');

  // --- PERSISTENCE ---
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Try backend first — this restores data after re-login or new device
        const profile = await getHirerProfile();
        if (profile) {
          if (profile.businessName) setRestaurantName(profile.businessName);
          if (profile.ownerName) setOwnerName(profile.ownerName);
          if (profile.contactRole) setContactRole(profile.contactRole as 'Owner' | 'Manager' | '');
          if (profile.email) setEmail(profile.email);
          if (profile.mobileNumber) setMobileNumber(profile.mobileNumber);
          if (profile.fssaiLicense) setFssaiLicense(profile.fssaiLicense);
          if (profile.gstNumber) setGstNumber(profile.gstNumber);
          if (profile.businessTypes?.length) setSelectedTypes(profile.businessTypes);
          if (profile.employeeCount) setEmployeeCount(String(profile.employeeCount));
          // if (profile.city) setCity(profile.city);
          // if (profile.state) setState(profile.state);
          return;
        }
      } catch (profileErr: any) {
        // 401/403 means the session is invalid — surface the error so the
        // user knows they need to re-login instead of silently seeing empty form
        if (profileErr?.statusCode === 401 || profileErr?.statusCode === 403) {
          console.error('[restaurant-setup] Auth error loading hirer profile:', profileErr?.message);
          // Do not fall through to AsyncStorage; the caller (role-selection) already
          // handles proper navigation after OTP verify, so this path is only for
          // the edit-profile flow where the token should still be valid.
        }
        // Network / server errors: fall through to AsyncStorage draft
      }
      try {
        const savedData = await AsyncStorage.getItem('restaurantSetupForm');
        if (savedData) {
          const data = JSON.parse(savedData);
          if (data.restaurantName) setRestaurantName(data.restaurantName);
          if (data.ownerName) setOwnerName(data.ownerName);
          if (data.contactRole) setContactRole(data.contactRole);
          if (data.email) setEmail(data.email);
          if (data.mobileNumber) setMobileNumber(data.mobileNumber);
          if (data.fssaiLicense) setFssaiLicense(data.fssaiLicense);
          if (data.gstNumber) setGstNumber(data.gstNumber);
          if (data.selectedTypes) setSelectedTypes(data.selectedTypes);
          if (data.employeeCount) setEmployeeCount(data.employeeCount);
          return;
        }
      } catch (error) {
        console.error('Error loading setup form data:', error);
      }
      // Last resort: pre-fill mobile number from auth session so the hirer
      // doesn't have to re-type their own number when completing first-time setup.
      try {
        const profileData = await getProfileData();
        if (profileData?.mobileNumber) setMobileNumber(profileData.mobileNumber);
      } catch {
        // non-fatal
      }
    };
    loadSavedData();
  }, []);

  useEffect(() => {
    const saveFormData = async () => {
      try {
        const formData = {
          restaurantName,
          ownerName,
          contactRole,
          email,
          mobileNumber,
          fssaiLicense,
          gstNumber,
          selectedTypes,
          employeeCount,
        };
        await AsyncStorage.setItem('restaurantSetupForm', JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving setup form data:', error);
      }
    };
    saveFormData();
  }, [restaurantName, ownerName, contactRole, email, mobileNumber, fssaiLicense, gstNumber, selectedTypes, employeeCount]);

  const calculateCompletion = () => {
    let count = 0;
    if (restaurantName.trim()) count++;
    if (ownerName.trim()) count++;
    if (contactRole) count++;
    if (selectedTypes.length > 0) count++;
    if (email.trim() && /\S+@\S+\.\S+/.test(email)) count++;
    if (mobileNumber.trim() && /^[0-9]{10}$/.test(mobileNumber)) count++;
    if (employeeCount.trim()) count++;
    let percentage = Math.round((count / 7) * 100);
    return percentage;
  };

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { width } = useWindowDimensions();

  const validate = () => {
    let isValid = true;
    let newErrors: { [key: string]: string } = {};

    if (!restaurantName.trim()) {
      newErrors.name = t('validation.nameRequired');
      isValid = false;
    }

    if (!ownerName.trim()) {
      newErrors.ownerName = t('validation.ownerRequired');
      isValid = false;
    }

    if (selectedTypes.length === 0) {
      newErrors.type = t('validation.typeRequired');
      isValid = false;
    }

    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('validation.emailInvalid');
      isValid = false;
    }

    if (mobileNumber.trim() && !/^[0-9]{10}$/.test(mobileNumber)) {
      newErrors.mobileNumber = t('validation.mobileInvalid');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const isDesktop = width >= 768;

  const businessTypes = [
    { id: 'Restaurant/Bakery/Bar', label: t('restaurantBakeryBar') || 'Restaurant/Bakery/Bar', icon: Utensils },
    { id: 'Hotel & Accomodation', label: t('hotelAccomodation') || 'Hotel & Accomodation', icon: BedDouble },
    { id: 'Laboratory/R&D', label: t('laboratoryRD') || 'Laboratory / Research & Development', icon: (props: any) => <MaterialCommunityIcons name="microscope" {...props} /> },
    { id: 'Food Processing Industry', label: t('foodProcessingIndustry') || 'Food Processing Industry', icon: (props: any) => <MaterialCommunityIcons name="factory" {...props} /> },
    { id: 'Retail/Distribution', label: t('retailDistribution') || 'Retail/Distribution', icon: Store },
  ];


  const handleContinue = async () => {
    if (!validate()) {
      Alert.alert(t('incompleteDetails') || 'Incomplete Details', t('fillRequiredFields') || 'Please fill in all required fields marked in red.');
      return;
    }
    try {
      // Silently attempt to capture device GPS (requires expo-location to be installed).
      // Non-fatal: if unavailable, coordinates are simply not sent this time.
      let gpsLatitude: number | undefined;
      let gpsLongitude: number | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          gpsLatitude = pos.coords.latitude;
          gpsLongitude = pos.coords.longitude;
        }
      } catch {
        // permission denied or GPS unavailable — continue without coordinates
      }

      await upsertHirerProfile({
        businessName: restaurantName.trim(),
        ownerName: ownerName.trim(),
        contactRole: contactRole || 'Owner',
        businessTypes: selectedTypes,
        email: email.trim() || undefined,
        mobileNumber: mobileNumber.trim() || undefined,
        fssaiLicense: fssaiLicense.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        employeeCount: employeeCount ? parseInt(employeeCount, 10) : undefined,
        // city: city.trim() || undefined,
        // state: state.trim() || undefined,
        latitude: gpsLatitude,
        longitude: gpsLongitude,
      });
      router.push({
        pathname: '/hirer/job-posting',
        params: { businessType: selectedTypes.join(',') },
      });
    } catch (e: any) {
      const msg = e?.message || 'Failed to save your business details. Please try again.';
      Alert.alert(t('error') || 'Error', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.white }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="dark" />
      <AppHeader showBack={true} showCallSupport showLanguage={true} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.vibrantHeader}>
          <ProgressIndicator
            currentStep={1}
            totalSteps={2}
            percentage={calculateCompletion()}
            stepTitle={t('businessDetails')}
          />
          <View style={styles.headerHero}>
            <View style={styles.heroTextBox}>
              <Text style={styles.vibrantTitle}>{t('tellUsAboutBusiness')}</Text>
              <Text style={styles.vibrantSubtitle}>{t('businessSubtitle')}</Text>
            </View>
            <View style={styles.heroIconBox}>
              <Store size={60} color="rgba(255,255,255,0.2)" />
            </View>
          </View>
        </View>

        <FadeInView style={[styles.floatingWorkspace, isDesktop && styles.desktopContent]}>
          <View style={styles.islandSurface}>
            {/* Identity Group */}
            <View style={styles.islandSection}>
              <View style={styles.sectionHeading}>
                <View style={[styles.accentRing, { borderColor: COLORS.primary }]} />
                <Text style={styles.islandSectionTitle} numberOfLines={2}>{t('businessDetails')}</Text>
              </View>

              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('restaurantName')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.vibrantInputBox, errors.name && styles.inputError]}>
                  <Ionicons name="business" size={22} color={COLORS.primary} />
                  <TextInput
                    style={styles.modernTextInput}
                    placeholder={t('restaurantNamePlaceholder') || "e.g. Royal Spice Garden"}
                    placeholderTextColor={COLORS.textLight}
                    value={restaurantName}
                    onChangeText={(text) => {
                      setRestaurantName(text);
                      if (text && errors.name) setErrors({ ...errors, name: '' });
                    }}
                  />
                </View>
                {errors.name && <Text style={styles.vibrantError}>{errors.name}</Text>}
              </View>

              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('ownerName') || t('contactPerson')} <Text style={styles.required}>*</Text></Text>

                <View style={styles.orbRoleSelector}>
                  <TouchableOpacity
                    onPress={() => setContactRole('Owner')}
                    style={[styles.roleOrb, contactRole === 'Owner' && styles.roleOrbActive]}
                  >
                    <View style={[styles.orbIcon, contactRole === 'Owner' && styles.orbIconActive]}>
                      <MaterialCommunityIcons name="account-tie" size={24} color={contactRole === 'Owner' ? COLORS.white : COLORS.primary} />
                    </View>
                    <Text style={[styles.orbText, contactRole === 'Owner' && styles.orbTextActive]}>{t('owner')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setContactRole('Manager')}
                    style={[styles.roleOrb, contactRole === 'Manager' && styles.roleOrbActive]}
                  >
                    <View style={[styles.orbIcon, contactRole === 'Manager' && styles.orbIconActive]}>
                      <MaterialCommunityIcons name="account-cog" size={24} color={contactRole === 'Manager' ? COLORS.white : COLORS.primary} />
                    </View>
                    <Text style={[styles.orbText, contactRole === 'Manager' && styles.orbTextActive]}>{t('manager')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.vibrantInputBox, errors.ownerName && styles.inputError, { marginTop: SPACING.md }]}>
                  <Feather name="user" size={22} color={COLORS.primary} />
                  <TextInput
                    style={styles.modernTextInput}
                    placeholder={t('fullNamePlaceholder') || "e.g. John Doe"}
                    placeholderTextColor={COLORS.textLight}
                    value={ownerName}
                    onChangeText={(text) => {
                      setOwnerName(text);
                      if (text && errors.ownerName) setErrors({ ...errors, ownerName: '' });
                    }}
                  />
                </View>
                {errors.ownerName && <Text style={styles.vibrantError}>{errors.ownerName}</Text>}
              </View>
            </View>

            {/* Industry Group */}
            <View style={styles.islandSection}>
              <View style={styles.sectionHeading}>
                <View style={[styles.accentRing, { borderColor: '#4CAF50' }]} />
                <Text style={styles.islandSectionTitle} numberOfLines={2}>{t('businessType')}</Text>
              </View>

              <TouchableOpacity
                style={[styles.vibrantSelectBox, errors.type && selectedTypes.length === 0 && styles.inputError]}
                onPress={() => setIsDropdownOpen(true)}
                activeOpacity={0.7}
              >
                <View style={styles.vibrantSelectLeft}>
                  <View style={styles.vibrantIconCircle}>
                    <Store size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modernLabelSmall}>{t('businessType')} <Text style={styles.required}>*</Text></Text>
                    <Text style={[styles.vibrantSelectText, selectedTypes.length === 0 && styles.placeholderText]} numberOfLines={1}>
                      {selectedTypes.length > 0
                        ? selectedTypes.length === 1
                          ? businessTypes.find(t => t.id === selectedTypes[0])?.label
                          : `${selectedTypes.length} ${t('typesSelected') || 'Selected'}`
                        : t('selectBusinessType') || "Select Business Type"}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward-circle" size={28} color={COLORS.primary} />
              </TouchableOpacity>
              {errors.type && <Text style={styles.vibrantError}>{errors.type}</Text>}


              <View style={[styles.vibrantInputRow, { marginTop: 20 }]}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={[styles.modernLabel, { flex: 1 }]} numberOfLines={1}>{t('numberOfEmployees')}</Text>
                  <View style={styles.vibrantBadge}><Text style={styles.vibrantBadgeText}>{t('optional')}</Text></View>
                </View>
                <View style={[styles.vibrantInputBox, errors.employeeCount && styles.inputError]}>
                  <Users size={22} color={COLORS.primary} />
                  <TextInput
                    style={styles.modernTextInput}
                    placeholder={t('numberOfEmployeesPlaceholder') || "e.g. 5"}
                    placeholderTextColor={COLORS.textLight}
                    value={employeeCount}
                    onChangeText={(text) => {
                      setEmployeeCount(text.replace(/[^0-9]/g, ''));
                      if (text && errors.employeeCount) setErrors({ ...errors, employeeCount: '' });
                    }}
                    keyboardType="numeric"
                  />
                </View>
                {errors.employeeCount && <Text style={styles.vibrantError}>{errors.employeeCount}</Text>}
              </View>

            </View>
            

            {/* Verification Group */}
            <View style={styles.islandSection}>
              <View style={styles.sectionHeading}>
                <View style={[styles.accentRing, { borderColor: '#2196F3' }]} />
                <Text style={styles.islandSectionTitle} numberOfLines={2}>{t('contactAndVerification')}</Text>
              </View>

              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={[styles.modernLabel, { flex: 1 }]} numberOfLines={1}>{t('mobileNumber')}</Text>
                  <View style={styles.vibrantBadge}><Text style={styles.vibrantBadgeText}>{t('optional')}</Text></View>
                </View>
                <View style={[styles.vibrantInputBox, errors.mobileNumber && styles.inputError]}>
                  <Feather name="phone" size={22} color={COLORS.primary} />
                  <TextInput
                    style={styles.modernTextInput}
                    placeholder={t('enterMobile') || "Enter 10-digit number"}
                    placeholderTextColor={COLORS.textLight}
                    value={mobileNumber}
                    onChangeText={(text) => {
                      setMobileNumber(text.replace(/[^0-9]/g, '').slice(0, 10));
                      if (text.length === 10 && errors.mobileNumber) setErrors({ ...errors, mobileNumber: '' });
                    }}
                    keyboardType="numeric"
                  />
                </View>
                {errors.mobileNumber && <Text style={styles.vibrantError}>{errors.mobileNumber}</Text>}
              </View>

              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={[styles.modernLabel, { flex: 1 }]} numberOfLines={1}>{t('email') || 'Email ID'}</Text>
                  <View style={styles.vibrantBadge}><Text style={styles.vibrantBadgeText}>{t('optional')}</Text></View>
                </View>
                <View style={[styles.vibrantInputBox, errors.email && styles.inputError]}>
                  <MaterialCommunityIcons name="email-check" size={22} color={COLORS.primary} />
                  <TextInput
                    style={styles.modernTextInput}
                    placeholder={t('emailPlaceholder') || "e.g. restaurant@example.com"}
                    placeholderTextColor={COLORS.textLight}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && <Text style={styles.vibrantError}>{errors.email}</Text>}
              </View>

              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={[styles.modernLabel, { flex: 1 }]} numberOfLines={1}>{t('fssaiLicense')}</Text>
                  <View style={styles.vibrantBadge}><Text style={styles.vibrantBadgeText}>{t('optional')}</Text></View>
                </View>
                <View style={styles.vibrantInputBox}>
                  <Ionicons name="shield-checkmark" size={22} color={COLORS.primary} />
                  <TextInput
                    style={styles.modernTextInput}
                    placeholder={t('fssaiLicensePlaceholder')}
                    placeholderTextColor={COLORS.textLight}
                    value={fssaiLicense}
                    onChangeText={setFssaiLicense}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                </View>
              </View>

              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={[styles.modernLabel, { flex: 1 }]} numberOfLines={1}>{t('gstNumber')}</Text>
                  <View style={styles.vibrantBadge}><Text style={styles.vibrantBadgeText}>{t('optional')}</Text></View>
                </View>
                <View style={styles.vibrantInputBox}>
                  <MaterialCommunityIcons name="file-document-edit" size={22} color={COLORS.primary} />
                  <TextInput
                    style={styles.modernTextInput}
                    placeholder={t('gstPlaceholder')}
                    placeholderTextColor={COLORS.textLight}
                    value={gstNumber}
                    onChangeText={setGstNumber}
                    autoCapitalize="characters"
                    maxLength={15}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 160 }} />
        </FadeInView>
      </ScrollView>

      {/* Business Type Modal */}
      <Modal
        visible={isDropdownOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsDropdownOpen(false);
          setBusinessSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectBusinessType')}</Text>
              <TouchableOpacity onPress={() => { setIsDropdownOpen(false); setBusinessSearch(''); }} style={styles.closeButton}>
                <Feather name="x" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Feather name="search" size={20} color={COLORS.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('searchBusinessType') || "Search business type..."}
                placeholderTextColor={COLORS.textLight}
                value={businessSearch}
                onChangeText={setBusinessSearch}
                autoFocus
              />
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {businessTypes
                .filter(type => type.label.toLowerCase().includes(businessSearch.toLowerCase()))
                .map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedTypes.includes(type.id);
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                      onPress={() => {
                        setSelectedTypes(prev => {
                          if (prev.includes(type.id)) {
                            return prev.filter(id => id !== type.id);
                          } else {
                            return [...prev, type.id];
                          }
                        });
                        if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
                      }}
                    >
                      <View style={styles.dropdownItemContent}>
                        <View style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: isSelected ? COLORS.primary : COLORS.border,
                          backgroundColor: isSelected ? COLORS.primary : 'transparent',
                          marginRight: 12,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <Feather name="check" size={14} color={COLORS.white} />}
                        </View>
                        <Icon size={22} color={isSelected ? COLORS.primary : COLORS.textSecondary} />
                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected, { marginLeft: 12 }]}>
                          {type.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              {businessTypes.filter(type => type.label.toLowerCase().includes(businessSearch.toLowerCase())).length === 0 && (
                <View style={styles.noResultsContainer}>
                  <MaterialCommunityIcons name="database-search-outline" size={48} color={COLORS.border} />
                  <Text style={styles.noResultsText}>{t('noBusinessTypesFound')}</Text>
                </View>
              )}
            </ScrollView>

            <View style={{ padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
              <PrimaryButton title={t('done') || 'Done'} onPress={() => { setIsDropdownOpen(false); setBusinessSearch(''); }} />
            </View>
          </View>
        </View>
      </Modal>


      {/* Footer Button */}
      <View style={[styles.footer, isDesktop && styles.desktopFooter, { paddingBottom: 50 }]}>
        <PrimaryButton
          title={t('continue')}
          onPress={handleContinue}
          style={styles.continueButton}
        />
      </View>
    </KeyboardAvoidingView >
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: '#F3F4F6',
  },
  desktopContent: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
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
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 34,
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
  modernLabelSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    marginBottom: 2,
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
  orbRoleSelector: {
    flexDirection: 'row',
    gap: 16,
  },
  roleOrb: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  roleOrbActive: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  orbIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  orbIconActive: {
    backgroundColor: COLORS.primary,
  },
  orbText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  orbTextActive: {
    color: COLORS.primary,
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
    flex: 1, // Added flex: 1
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
    color: COLORS.secondary,
    fontWeight: '800',
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
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 12,
  },
  inputError: {
    borderColor: COLORS.error + '40',
    backgroundColor: COLORS.error + '05',
  },
  required: {
    color: COLORS.error,
  },
  uploadContainer: {
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
    borderRadius: SIZES.radius,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    marginBottom: SPACING.md,
    height: 150,
  },
  uploadText: {
    marginTop: SPACING.md,
    fontSize: SIZES.body2,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  uploadSubtext: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: SIZES.body1,
    color: '#000000',
    backgroundColor: COLORS.white,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
  },
  dropdownTriggerOpen: {
    borderColor: COLORS.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownText: {
    fontSize: SIZES.body1,
    color: '#000000',
  },
  placeholderText: {
    color: COLORS.textLight,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 0,
    borderBottomLeftRadius: SIZES.radius,
    borderBottomRightRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    maxHeight: 250,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownItemText: {
    fontSize: SIZES.body2,
    color: COLORS.secondary,
  },
  dropdownItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  rowContainer: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  column: {
    flex: 1,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  desktopFooter: {
    position: 'relative',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 0,
    borderTopWidth: 0,
    paddingBottom: SPACING.xl,
  },
  continueButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  closeButton: {
    padding: 4,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#F3F4F6',
    margin: SPACING.md,
    borderRadius: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: SIZES.body2,
    color: COLORS.secondary,
    paddingVertical: 8,
  },
  modalScrollContent: {
    paddingHorizontal: SPACING.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  modalItemText: {
    fontSize: SIZES.body2,
    color: COLORS.secondary,
  },
  modalItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    marginTop: 12,
    fontSize: SIZES.body2,
    color: COLORS.textLight,
  },
});