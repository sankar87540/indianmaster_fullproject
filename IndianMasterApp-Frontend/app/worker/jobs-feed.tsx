import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image, Alert, Platform, Linking, TextInput, KeyboardAvoidingView, Keyboard, Animated, Modal, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { MapPin, Clock, Building, Briefcase, Search, MessageCircle, User as UserIcon, Settings, LogOut, ChevronRight, Star, Camera, Plus, Clipboard, Bell, Phone, Menu, X, Lock, Globe } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FadeInView from '@/components/FadeInView';
import TopNavBar from '@/components/TopNavBar';
import { getProfileData, saveProfileData, clearAll, getAuthSession, getAuthToken } from '@/utils/storage';
import React, { useCallback, useEffect, useRef } from 'react';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import ProgressIndicator from '@/components/ProgressIndicator';
import { getJobsFeed, getWorkerProfile, applyToJob, getMyApplications, getChatThreads, submitInstantApplication, uploadWorkerPhoto, uploadWorkerResume, getWorkerResume, openWorkerResume, JobFeedItem, ChatThread, WorkerResumeResponse } from '@/services/workerService';
import { getUnreadCount } from '@/services/notificationService';
import { ApiError } from '@/services/apiClient';
import { COLORS, SHADOWS } from '@/constants/theme';

const FALLBACK_CHAT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=100';

export default function JobsFeedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('jobs');
  const [profileImage, setProfileImage] = useState<any>({ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1780&auto=format&fit=crop' });
  const { width } = useWindowDimensions();
  const [profileData, setProfileData] = useState<any>({});
  const [feedJobs, setFeedJobs] = useState<JobFeedItem[]>([]);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [instantJobModalVisible, setInstantJobModalVisible] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [resume, setResume] = useState<WorkerResumeResponse | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [openingResume, setOpeningResume] = useState(false);
  const [resumeJustUploaded, setResumeJustUploaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  // ⚡ Blink animation for Instant Job badge
  const blinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.1, duration: 500, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: '',
    experience: '',
    location: '',
    companyName: ''
  });

  // Fetch updated profile data and jobs feed whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const session = await getAuthSession();
        const token = await getAuthToken();
        // Guard: require a worker session with a stored JWT.
        // Checking role prevents a stale hirer JWT from reaching worker API
        // endpoints, where it would get a 403 that was previously swallowed silently.
        if (!session?.loggedIn || !token || session.role !== 'worker') {
          router.replace('/');
          return;
        }

        const handleAuthError = (e: any) => {
          if (e instanceof ApiError && (e.statusCode === 401 || e.statusCode === 403)) {
            clearAll().then(() => router.replace('/'));
          }
        };

        const data = await getProfileData();
        if (data) {
          setProfileData(data);
          if (data.profileImage) {
            setProfileImage({ uri: data.profileImage });
          }
        }
        try {
          const profile = await getWorkerProfile();
          setWorkerProfile(profile);
          // Prefer the backend-stored photo URL over the local AsyncStorage copy
          if (profile.profilePhotoUrl) {
            setProfileImage({ uri: profile.profilePhotoUrl });
          }
        } catch (e: any) {
          handleAuthError(e);
        }
        try {
          const result = await getJobsFeed(1, 20);
          setFeedJobs(result.data);
        } catch (e: any) {
          handleAuthError(e);
        }
        try {
          const appResult = await getMyApplications(1, 100);
          setAppliedJobs(appResult.data.map((a) => a.jobId));
        } catch (e: any) {
          handleAuthError(e);
        }
        try {
          const chatResult = await getChatThreads(1, 20);
          setChatThreads(chatResult.data);
        } catch (e: any) {
          handleAuthError(e);
        }
        try {
          const existingResume = await getWorkerResume();
          setResume(existingResume);
        } catch {
          // non-critical — leave resume as null
        }
        getUnreadCount().then(setUnreadCount).catch(() => {});
      };
      loadProfile();
    }, [])
  );

  useEffect(() => {
    if (menuVisible) {
      Animated.timing(menuSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(menuSlideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible]);

  const toggleMenu = (visible: boolean) => {
    if (visible) {
      setMenuVisible(true);
    } else {
      Animated.timing(menuSlideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    }
  };

  useEffect(() => {
    if (params.initialTab) {
      setActiveTab(params.initialTab as string);
    }
  }, [params.initialTab]);

  // Prefer backend-computed value; fall back to route param → AsyncStorage → default 40
const handlePhotoUpload = async (uri: string, mimeType: string) => {
    try {
      const url = await uploadWorkerPhoto(uri, mimeType);
      setProfileImage({ uri: url });
      await saveProfileData({ profileImage: url });
    } catch {
      // Upload failed — fall back to showing the local image without persisting
      setProfileImage({ uri });
      Alert.alert('Upload failed', 'Profile photo saved locally but could not be uploaded. Try again later.');
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        await handlePhotoUpload(asset.uri, asset.mimeType ?? 'image/jpeg');
      }
      return;
    }

    Alert.alert(
      'Update Profile Photo',
      'Choose a source',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              const asset = result.assets[0];
              await handlePhotoUpload(asset.uri, asset.mimeType ?? 'image/jpeg');
            }
          }
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Gallery permission is required.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              const asset = result.assets[0];
              await handlePhotoUpload(asset.uri, asset.mimeType ?? 'image/jpeg');
            }
          }
        },
        {
          text: 'Cancel',
          onPress: () => { }
        }
      ]
    );
  };

  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;

  const handleApply = async (jobId: string) => {
    if (appliedJobs.includes(jobId)) return;
    try {
      await applyToJob(jobId);
      setAppliedJobs([...appliedJobs, jobId]);
      Alert.alert(
        'Success',
        'Successfully Applied',
        [
          {
            text: 'OK',
            onPress: () => router.push('/worker/job-applied-success')
          }
        ]
      );
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 409) {
        // Already applied — sync local state
        setAppliedJobs([...appliedJobs, jobId]);
        Alert.alert('Already Applied', 'You have already applied to this job.');
      } else {
        Alert.alert('Error', 'Failed to apply. Please try again.');
      }
    }
  };

  const handleSave = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter(id => id !== jobId));
    } else {
      setSavedJobs([...savedJobs, jobId]);
      Alert.alert('Saved', 'Job saved to your list.');
    }
  };

  const handleViewDetails = (jobId: string) => {
    router.push({ pathname: '/worker/job-detail', params: { jobId } });
  };

  const handleWatchVideo = () => {
    Linking.openURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); // Placeholder YouTube link, can be replaced
  };

  const handleResumeUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType ?? 'application/octet-stream';
        const fileName = asset.name ?? 'resume';
        setUploadingResume(true);
        try {
          const uploaded = await uploadWorkerResume(asset.uri, mimeType, fileName);
          setResume(uploaded);
          setResumeJustUploaded(true);
        } catch (uploadErr: any) {
          Alert.alert('Upload Failed', uploadErr?.message ?? 'Failed to upload resume. Please try again.');
        } finally {
          setUploadingResume(false);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick resume document');
    }
  };

  const handleOpenResume = async () => {
    if (!resume) return;
    setOpeningResume(true);
    try {
      await openWorkerResume(resume);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not open resume. Please try again.');
    } finally {
      setOpeningResume(false);
    }
  };

  // --- HELPERS ---

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isValidCoord = (v: number | null | undefined): v is number =>
    v != null && !isNaN(v) && isFinite(v) && v !== 0;

  const formatJobDistance = (jobLat: number | null, jobLon: number | null): string => {
    const workerLat = workerProfile?.liveLatitude;
    const workerLon = workerProfile?.liveLongitude;
    if (
      isValidCoord(workerLat) && isValidCoord(workerLon) &&
      isValidCoord(jobLat) && isValidCoord(jobLon)
    ) {
      const km = haversineKm(workerLat, workerLon, jobLat, jobLon);
      return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
    }
    return '';
  };

  const formatSalary = (min: number, max: number): string => {
    if (!min && !max) return '';
    if (min && max) return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
    if (min) return `₹${min.toLocaleString('en-IN')}+`;
    return `Up to ₹${max.toLocaleString('en-IN')}`;
  };

  const daysAgo = (dateStr: string): string => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  const formatThreadTime = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // --- RENDER FUNCTIONS ---

  const renderJobs = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        isSmallScreen && styles.scrollContentSmall
      ]}
    >
      {feedJobs.length === 0 ? (
        <View style={styles.centerContent}>
          <Briefcase size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No jobs available</Text>
          <Text style={styles.emptySubtitle}>Check back soon for new opportunities</Text>
        </View>
      ) : feedJobs.map((job) => {
        const hasApplied = appliedJobs.includes(job.id);
        const isSaved = savedJobs.includes(job.id);
        const location = [job.city, job.state].filter(Boolean).join(', ');
        const salary = formatSalary(job.salaryMinAmount, job.salaryMaxAmount);
        const timing = job.workingHours ? `${job.workingHours} hrs/day` : '';
        const experience = job.experienceMin ? `${job.experienceMin}+ yrs` : '';
        const distance = formatJobDistance(job.latitude, job.longitude);

        return (
          <Card
            key={job.id}
            style={[
              styles.jobCard,
              isSmallScreen && styles.jobCardSmall
            ]}
          >
            <TouchableOpacity activeOpacity={0.7} onPress={() => handleViewDetails(job.id)}>
            <View style={styles.jobHeader}>
              <View style={styles.jobTitleRow}>
                <Text style={[
                  styles.restaurantName,
                  isSmallScreen && styles.restaurantNameSmall
                ]}>
                  {job.businessName}
                </Text>
              </View>
              <Text style={[
                styles.jobRole,
                isSmallScreen && styles.jobRoleSmall
              ]}>
                {job.jobRole}
              </Text>
              <Text style={[
                styles.postedDate,
                isSmallScreen && styles.postedDateSmall
              ]}>
                {daysAgo(job.createdAt)}
              </Text>
            </View>

            <View style={[
              styles.jobDetails,
              isSmallScreen && styles.jobDetailsSmall
            ]}>
              {!!salary && (
                <View style={styles.detailRow}>
                  <Text style={[
                    styles.salary,
                    isSmallScreen && styles.salarySmall
                  ]}>
                    {salary}
                  </Text>
                </View>
              )}

              {!!location && (
                <View style={styles.detailRow}>
                  <MapPin size={isSmallScreen ? 14 : 16} color={COLORS.textSecondary} />
                  <Text style={[
                    styles.location,
                    isSmallScreen && styles.locationSmall
                  ]}>
                    {location}{!!distance ? `  ·  ${distance}` : ''}
                  </Text>
                </View>
              )}

              {!!timing && (
                <View style={styles.detailRow}>
                  <Clock size={isSmallScreen ? 14 : 16} color={COLORS.textSecondary} />
                  <Text style={[
                    styles.timing,
                    isSmallScreen && styles.timingSmall
                  ]}>
                    {timing}
                  </Text>
                </View>
              )}

              {!!job.workType && (
                <View style={styles.detailRow}>
                  <Building size={isSmallScreen ? 14 : 16} color={COLORS.textSecondary} />
                  <Text style={[
                    styles.type,
                    isSmallScreen && styles.typeSmall
                  ]}>
                    {job.workType}
                  </Text>
                </View>
              )}
            </View>

            <View style={[
              styles.jobMeta,
              isSmallScreen && styles.jobMetaSmall
            ]}>
              {!!experience && (
                <Text style={[
                  styles.experience,
                  isSmallScreen && styles.experienceSmall
                ]}>
                  Experience: {experience}
                </Text>
              )}
              <View style={styles.benefits}>
                {(job.benefits || []).slice(0, 2).map((benefit, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.benefit,
                      isSmallScreen && styles.benefitSmall
                    ]}
                  >
                    • {benefit}
                  </Text>
                ))}
              </View>
            </View>
            </TouchableOpacity>

            <View style={[
              styles.actionButtons,
              isSmallScreen && styles.actionButtonsSmall
            ]}>
              <TouchableOpacity
                style={[styles.iconButton, { borderColor: '#ef4444' }]}
                onPress={handleWatchVideo}
              >
                <MaterialCommunityIcons
                  name="youtube"
                  size={24}
                  color="#ef4444"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, isSaved && styles.iconButtonActive]}
                onPress={() => handleSave(job.id)}
              >
                <Star
                  size={20}
                  color={isSaved ? COLORS.primary : COLORS.textSecondary}
                  fill={isSaved ? COLORS.primary : 'none'}
                />
              </TouchableOpacity>
              <PrimaryButton
                title={hasApplied ? "Applied ✓" : "Apply Now"}
                onPress={() => handleApply(job.id)}
                disabled={hasApplied}
                style={[
                  styles.actionButton,
                  hasApplied && styles.appliedButton
                ]}
              />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );

  const totalUnread = chatThreads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);

  const renderChats = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <FadeInView style={styles.floatingWorkspace}>
        <View style={styles.islandSurface}>
          <View style={styles.islandSection}>
            <View style={styles.sectionHeading}>
              <View style={[styles.accentRing, { borderColor: COLORS.primary }]} />
              <Text style={styles.islandSectionTitle}>{t('chats')}</Text>
            </View>

            {chatThreads.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <MessageCircle size={48} color={COLORS.border} />
                <Text style={{ marginTop: 12, color: COLORS.textSecondary, textAlign: 'center' }}>
                  No conversations yet.{'\n'}Hirers who contact you{'\n'}will appear here.
                </Text>
              </View>
            ) : chatThreads.map((thread) => {
              const displayName = thread.hirerName || `Hirer ${thread.hirerId.slice(0, 6)}`;
              const preview = thread.lastMessagePreview || 'Tap to view messages';
              return (
                <TouchableOpacity
                  key={thread.id}
                  style={styles.vibrantWorkerCard}
                  onPress={() => router.push({
                    pathname: '/chat/[id]',
                    params: { id: thread.id, name: displayName, image: FALLBACK_CHAT_IMAGE }
                  })}
                  activeOpacity={0.9}
                >
                  <View style={styles.workerMainInfo}>
                    <View style={styles.vibrantPhotoBox}>
                      <Image source={{ uri: FALLBACK_CHAT_IMAGE }} style={styles.vibrantPhoto} />
                      {thread.unreadCount > 0 && (
                        <View style={[styles.vibrantOnlineBadge, { backgroundColor: COLORS.primary }]} />
                      )}
                    </View>

                    <View style={styles.vibrantDetails}>
                      <View style={styles.nameRow}>
                        <Text style={styles.vibrantWorkerName}>{displayName}</Text>
                        <Text style={styles.chatTime}>{formatThreadTime(thread.lastMessageAt)}</Text>
                      </View>
                      <Text style={styles.chatLastMessage} numberOfLines={1}>{preview}</Text>
                      {thread.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{thread.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </FadeInView>
    </ScrollView>
  );

  const handleFormSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.role) {
      Alert.alert('Missing Fields', 'Please fill in Name, Mobile, and Job Role.');
      return;
    }
    if (formSubmitting) return;
    setFormSubmitting(true);
    try {
      await submitInstantApplication({
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        experience: formData.experience || undefined,
        location: formData.location || undefined,
        companyName: formData.companyName || undefined,
      });
      setFormData({ name: '', phone: '', role: '', experience: '', location: '', companyName: '' });
      router.push('/worker/job-applied-success');
    } catch (e: any) {
      Alert.alert('Submission Failed', e?.message ?? 'Could not submit application. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const renderForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <Text style={styles.sectionSubtitle}>{t('fillDetailsProcessing')}</Text>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('fullName')} *</Text>
              <View style={styles.inputWrapper}>
                <UserIcon size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('fullNamePlaceholder')}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('mobileNumber')} *</Text>
              <View style={styles.inputWrapper}>
                <MessageCircle size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('enterMobile')}
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('jobRole')} *</Text>
              <View style={styles.inputWrapper}>
                <Briefcase size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('selectRole')}
                  value={formData.role}
                  onChangeText={(text) => setFormData({ ...formData, role: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('experience')} ({t('years')})</Text>
              <View style={styles.inputWrapper}>
                <Clock size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('experienceLevel')}
                  value={formData.experience}
                  onChangeText={(text) => setFormData({ ...formData, experience: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('city')}</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('cityPlaceholder')}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('companyName')}</Text>
              <View style={styles.inputWrapper}>
                <Building size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('companyNamePlaceholder')}
                  value={formData.companyName}
                  onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                />
              </View>
            </View>

            <PrimaryButton
              title={formSubmitting ? 'Submitting...' : t('submitApplication')}
              onPress={handleFormSubmit}
              disabled={formSubmitting}
              style={{ marginTop: 24 }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderSaved = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      {savedJobs.length === 0 ? (
        <View style={styles.centerContent}>
          <Star size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>{t('workerProfile.noSavedJobs')}</Text>
          <Text style={styles.emptySubtitle}>{t('workerProfile.savedJobsSubtitle')}</Text>
          <PrimaryButton
            title={t('workerProfile.findJobs')}
            onPress={() => setActiveTab('jobs')}
            style={{ marginTop: 24, width: 200 }}
          />
        </View>
      ) : (
        <View>
          <Text style={styles.sectionTitle}>{t('workerProfile.yourSavedJobs')} ({savedJobs.length})</Text>
          {feedJobs.filter(j => savedJobs.includes(j.id)).map(job => (
            <Card key={job.id} style={styles.jobCard}>
              <View style={styles.jobTitleRow}>
                <Text style={styles.restaurantName}>{job.businessName}</Text>
                <TouchableOpacity onPress={() => handleSave(job.id)}>
                  <Star size={20} color={COLORS.primary} fill={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.jobRole}>{job.jobRole}</Text>
              <Text style={styles.salary}>{formatSalary(job.salaryMinAmount, job.salaryMaxAmount)}</Text>
              <PrimaryButton
                title={t('workerProfile.applyNow')}
                onPress={() => handleApply(job.id)}
                style={{ marginTop: 12 }}
              />
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <View style={styles.profileHeaderCard}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.7} style={styles.profileImageContainer}>
          <Image
            source={profileImage}
            style={styles.profileImage}
          />
          <View style={styles.cameraIconBadge}>
            <Plus size={16} color={COLORS.white} />
          </View>
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{workerProfile?.fullName || profileData.fullName || t('workerProfile.completeProfile')}</Text>
          <Text style={styles.profileLocation}>
            {workerProfile?.selectedRoles?.[0] || profileData.selectedRoles?.[0] || t('workerProfile.roleNotSet')}, {workerProfile?.experienceYears ? `${workerProfile.experienceYears} ${t('workerProfile.yrsExp')}` : (profileData.selectedExperience?.[0] ? `${profileData.selectedExperience[0]} ${t('workerProfile.yrsExp')}` : t('workerProfile.expNotSet'))}
          </Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push('/worker/profile-setup')}
          >
            <Text style={styles.editProfileText}>{t('workerProfile.editProfile')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setActiveTab('saved')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#FFF7ED' }]}>
            <Star size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.menuText}>{t('workerProfile.savedJobs')}</Text>
          <ChevronRight size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleResumeUpload}
          disabled={uploadingResume}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#E0E7FF' }]}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#4338CA" />
          </View>
          <Text style={styles.menuText}>
            {uploadingResume ? 'Uploading...' : resume ? 'Replace Resume' : t('workerProfile.uploadResume')}
          </Text>
          <ChevronRight size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Resume Status Card */}
        <View style={[
          styles.resumeStatusCard,
          resume && !uploadingResume && styles.resumeStatusCardUploaded,
        ]}>
          {uploadingResume ? (
            <View style={styles.resumeStatusRow}>
              <View style={styles.resumeIconWrap}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={22} color="#4338CA" />
              </View>
              <View style={styles.resumeStatusTextBlock}>
                <Text style={styles.resumeStatusTitle}>Uploading resume...</Text>
                <Text style={styles.resumeStatusSub}>Please wait</Text>
              </View>
            </View>
          ) : resume ? (
            <>
              <View style={styles.resumeStatusRow}>
                <View style={styles.resumeIconWrap}>
                  <MaterialCommunityIcons
                    name={resume.mimeType?.includes('pdf') ? 'file-pdf-box' : 'file-word-box'}
                    size={26}
                    color={resume.mimeType?.includes('pdf') ? '#DC2626' : '#2563EB'}
                  />
                </View>
                <View style={styles.resumeStatusTextBlock}>
                  <Text style={styles.resumeStatusTitle} numberOfLines={1}>
                    {(() => { try { return decodeURIComponent(resume.originalName).replace(/\+/g, ' '); } catch { return resume.originalName; } })()}
                  </Text>
                  <Text style={styles.resumeStatusSub}>
                    {resume.fileSize >= 1024 * 1024
                      ? `${(resume.fileSize / (1024 * 1024)).toFixed(1)} MB`
                      : `${(resume.fileSize / 1024).toFixed(0)} KB`
                    } · {resume.uploadedAt && !isNaN(new Date(resume.uploadedAt).getTime())
                      ? new Date(resume.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Recently uploaded'}
                  </Text>
                  <Text style={styles.resumeReadyText}>
                    {resumeJustUploaded ? 'Resume uploaded successfully' : 'Your resume is ready'}
                  </Text>
                </View>
                <View style={styles.resumeUploadedBadge}>
                  <MaterialCommunityIcons name="check" size={11} color="#16A34A" />
                  <Text style={styles.resumeUploadedBadgeText}>Uploaded</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.resumeViewBtn}
                onPress={handleOpenResume}
                disabled={openingResume}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="eye-outline" size={13} color="#4338CA" />
                <Text style={styles.resumeViewBtnText}>
                  {openingResume ? 'Opening...' : 'View Resume'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.resumeStatusRow}>
              <View style={styles.resumeIconWrap}>
                <MaterialCommunityIcons name="file-upload-outline" size={22} color={COLORS.textSecondary} />
              </View>
              <View style={styles.resumeStatusTextBlock}>
                <Text style={[styles.resumeStatusTitle, styles.resumeEmptyTitle]}>No resume uploaded yet</Text>
                <Text style={styles.resumeStatusSub}>Upload a PDF or Word document to boost your profile</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/worker/settings-menu')}
        >
          <View style={styles.menuIconContainer}>
            <Settings size={20} color={COLORS.text} />
          </View>
          <Text style={styles.menuText}>{t('settings')}</Text>
          <ChevronRight size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Alert.alert(
              t('workerProfile.logoutConfirmTitle'),
              t('workerProfile.logoutConfirmMessage'),
              [
                { text: t('workerProfile.cancel'), style: 'cancel' },
                {
                  text: t('logout'),
                  style: 'destructive',
                  onPress: async () => {
                    await clearAll();
                    router.replace('/');
                  }
                }
              ]
            );
          }}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#FEE2E2' }]}>
            <LogOut size={20} color={COLORS.error} />
          </View>
          <Text style={[styles.menuText, { color: COLORS.error }]}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // --- DYNAMIC CONTENT ---
  const getPageInfo = () => {
    switch (activeTab) {
      case 'jobs': return { title: t('jobs'), subtitle: t('jobsAvailableSubtitle') };
      case 'form': return { title: t('jobApplicationForm'), subtitle: t('appliedJobsSubtitle') };
      case 'chats': return { title: t('chats'), subtitle: t('startContacting') };
      case 'saved': return { title: t('workerProfile.savedJobs'), subtitle: t('savedJobsOpportunities') };
      case 'profile': return { title: t('profile'), subtitle: t('manageCareerProfile') };
      default: return { title: t('jobs'), subtitle: '' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <View style={styles.container}>
      {/* Header Area — matches Hirer page structure */}
      <View style={styles.headerContainer}>
        <TopNavBar unreadCount={unreadCount} onMenuPress={() => toggleMenu(true)} />
        <View style={styles.vibrantHeader}>
          <View style={styles.headerHero}>
            <View style={styles.heroTextBox}>
              <Text style={styles.vibrantTitle}>{title}</Text>
              <Text style={styles.vibrantSubtitle}>{subtitle}</Text>
            </View>
            <View style={styles.heroIconBox}>
              {activeTab === 'jobs' && <Briefcase size={32} color="rgba(255,255,255,0.3)" />}
              {activeTab === 'chats' && <MessageCircle size={32} color="rgba(255,255,255,0.3)" />}
              {activeTab === 'form' && <Clipboard size={32} color="rgba(255,255,255,0.3)" />}
              {activeTab === 'saved' && <Star size={32} color="rgba(255,255,255,0.3)" />}
              {activeTab === 'profile' && <UserIcon size={32} color="rgba(255,255,255,0.3)" />}
            </View>
          </View>
        </View>
      </View>

      {/* Menu Drawer Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => toggleMenu(false)}
      >
        <View style={styles.workerMenuOverlay}>
          <TouchableOpacity
            style={styles.workerMenuCloseArea}
            activeOpacity={1}
            onPress={() => toggleMenu(false)}
          />
          <Animated.View
            style={[
              styles.workerMenuDrawer,
              { transform: [{ translateX: menuSlideAnim }] }
            ]}
          >
            <View style={[styles.workerMenuHeader, { paddingTop: insets.top + 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.workerDrawerLogo}
                  resizeMode="contain"
                />
              </View>
              <TouchableOpacity onPress={() => toggleMenu(false)} style={styles.workerDrawerCloseButton}>
                <X size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.workerDrawerSection}>
                <Text style={styles.workerDrawerSectionTitle}>{t('profile')}</Text>
                <TouchableOpacity style={styles.workerMenuRow} onPress={() => { toggleMenu(false); setActiveTab('profile'); }}>
                  <UserIcon size={20} color={COLORS.secondary} />
                  <Text style={styles.workerMenuRowText}>{t('profile')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.workerMenuRow} onPress={() => { toggleMenu(false); setActiveTab('saved'); }}>
                  <Star size={20} color={COLORS.secondary} />
                  <Text style={styles.workerMenuRowText}>{t('workerProfile.savedJobs')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.workerDrawerDivider} />

              <View style={styles.workerDrawerSection}>
                <Text style={styles.workerDrawerSectionTitle}>{t('supportBtn')}</Text>
                <TouchableOpacity style={styles.workerMenuRow} onPress={() => { toggleMenu(false); router.push('/worker/help-support'); }}>
                  <Globe size={20} color={COLORS.secondary} />
                  <Text style={styles.workerMenuRowText}>{t('helpSupport')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.workerMenuRow} onPress={() => { toggleMenu(false); Alert.alert('Privacy & Terms', 'Privacy Policy and Terms of Service...'); }}>
                  <Lock size={20} color={COLORS.secondary} />
                  <Text style={styles.workerMenuRowText}>{t('privacyTerms')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.workerDrawerDivider} />

              <TouchableOpacity
                style={[styles.workerMenuRow, { marginTop: 10 }]}
                onPress={() => {
                  toggleMenu(false);
                  Alert.alert(
                    t('logout'),
                    'Are you sure you want to log out?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: t('logout'),
                        style: 'destructive',
                        onPress: async () => {
                          await clearAll();
                          router.replace('/');
                        }
                      }
                    ]
                  );
                }}
              >
                <View style={styles.workerLogoutIconBox}>
                  <LogOut size={20} color={COLORS.error} />
                </View>
                <Text style={[styles.workerMenuRowText, { color: COLORS.error }]}>{t('logout')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ⚡ Instant Job Custom Modal */}
      <Modal
        visible={instantJobModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInstantJobModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.instantModal}>
            {/* X Close Button - Top Right */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setInstantJobModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.instantModalTitle}>{t('instantJobTitle')}</Text>

            {/* Message */}
            <Text style={styles.instantModalMessage}>{t('instantJobMessage')}</Text>

            {/* Fill Form Button */}
            <TouchableOpacity
              style={styles.instantModalBtn}
              onPress={() => {
                setInstantJobModalVisible(false);
                setActiveTab('form');
              }}
            >
              <Text style={styles.instantModalBtnText}>{t('instantJobOk')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {activeTab === 'jobs' && renderJobs()}
      {activeTab === 'chats' && renderChats()}
      {activeTab === 'form' && renderForm()}
      {activeTab === 'saved' && renderSaved()}
      {activeTab === 'profile' && renderProfile()}

      {/* Bottom Navigation Bar */}
      <View style={[
        styles.bottomNav,
        isSmallScreen && styles.bottomNavSmall
      ]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('jobs')}
        >
          <Briefcase
            size={isSmallScreen ? 22 : 24}
            color={activeTab === 'jobs' ? COLORS.navActive : COLORS.navInactive}
          />
          <Text style={[
            styles.navLabel,
            activeTab === 'jobs' && styles.navLabelActive,
            isSmallScreen && styles.navLabelSmall
          ]}>
            {t('jobs')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('chats')}
        >
          <MessageCircle
            size={isSmallScreen ? 22 : 24}
            color={activeTab === 'chats' ? COLORS.navActive : COLORS.navInactive}
          />
          <Text style={[
            styles.navLabel,
            activeTab === 'chats' && styles.navLabelActive,
            isSmallScreen && styles.navLabelSmall
          ]}>
            {t('chats')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setInstantJobModalVisible(true)}
        >
          {/* ⚡ Instant Job blinking badge */}
          <Animated.View style={[styles.instantBadge, { opacity: blinkAnim }]}>
            <Text style={styles.instantBadgeText}>⚡ Instant</Text>
          </Animated.View>
          <Clipboard
            size={isSmallScreen ? 22 : 24}
            color={activeTab === 'form' ? COLORS.navActive : COLORS.navInactive}
          />
          <Text style={[
            styles.navLabel,
            activeTab === 'form' && styles.navLabelActive,
            isSmallScreen && styles.navLabelSmall
          ]}>
            {t('form')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('profile')}
        >
          <UserIcon
            size={isSmallScreen ? 22 : 24}
            color={activeTab === 'profile' ? COLORS.navActive : COLORS.navInactive}
          />
          <Text style={[
            styles.navLabel,
            activeTab === 'profile' && styles.navLabelActive,
            isSmallScreen && styles.navLabelSmall
          ]}>
            {t('profile')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // Header — matches Hirer page
  headerContainer: {
    backgroundColor: COLORS.white,
  },
  vibrantHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingBottom: 60,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  heroTextBox: {
    flex: 1,
  },
  vibrantTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  vibrantSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '500',
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Worker menu drawer
  workerMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
  },
  workerMenuCloseArea: {
    flex: 1,
  },
  workerMenuDrawer: {
    width: 320,
    maxWidth: '85%',
    height: '100%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    ...Platform.select({
      ios: SHADOWS.large,
      android: { ...SHADOWS.large, elevation: 20 }
    }),
  },
  workerMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  workerDrawerLogo: {
    width: 130,
    height: 45,
    marginLeft: -5,
  },
  workerDrawerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerDrawerSection: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  workerDrawerSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  workerDrawerDivider: {
    height: 1.5,
    backgroundColor: '#F8FAFC',
    marginVertical: 15,
  },
  workerMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 16,
  },
  workerMenuRowText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  workerLogoutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100, // Space for bottom nav
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 10,
  },
  scrollContentSmall: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  jobCard: {
    marginBottom: 16,
  },
  jobCardSmall: {
    marginBottom: 12,
  },
  formSection: {
    paddingTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    marginTop: -12,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
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
  jobHeader: {
    marginBottom: 16,
  },
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  restaurantNameSmall: {
    fontSize: 16,
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
  },
  urgentTextSmall: {
    fontSize: 11,
  },
  jobRole: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  jobRoleSmall: {
    fontSize: 15,
  },
  postedDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  postedDateSmall: {
    fontSize: 11,
  },
  jobDetails: {
    marginBottom: 16,
    gap: 8,
  },
  jobDetailsSmall: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
  },
  salarySmall: {
    fontSize: 15,
  },
  location: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  locationSmall: {
    fontSize: 13,
  },
  timing: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  timingSmall: {
    fontSize: 13,
  },
  type: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  typeSmall: {
    fontSize: 13,
  },
  jobMeta: {
    marginBottom: 12,
  },
  jobMetaSmall: {
    marginBottom: 10,
  },
  experience: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  experienceSmall: {
    fontSize: 13,
    marginBottom: 6,
  },
  benefits: {
    gap: 4,
  },
  benefit: {
    fontSize: 12,
    color: COLORS.success,
  },
  benefitSmall: {
    fontSize: 11,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  descriptionSmall: {
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonsSmall: {
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  iconButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF7ED',
  },
  appliedButton: {
    backgroundColor: COLORS.success,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomNavSmall: {
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    overflow: 'visible',
  },
  instantBadge: {
    position: 'absolute',
    top: -14,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 10,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  instantBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.navInactive,
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelSmall: {
    fontSize: 10,
    marginTop: 3,
  },
  navLabelActive: {
    color: COLORS.navActive,
    fontWeight: '600',
  },

  // Profile Styles
  profileHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  profileLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  resumeStatusCard: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  resumeStatusCardUploaded: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  resumeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resumeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resumeStatusTextBlock: {
    flex: 1,
  },
  resumeStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  resumeEmptyTitle: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  resumeStatusSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resumeReadyText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
    marginTop: 3,
  },
  resumeUploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  resumeUploadedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  resumeViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  resumeViewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
  },
  // --- Chat Styles ---
  // ── Chat tab — island layout (matches hirer UI) ──────────────────────────────
  floatingWorkspace: {
    marginTop: -30,
    paddingHorizontal: 16,
  },
  islandSurface: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingVertical: 10,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  islandSection: {
    paddingHorizontal: 20,
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
  vibrantWorkerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  workerMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibrantPhotoBox: {
    position: 'relative',
    marginRight: 16,
  },
  vibrantPhoto: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  vibrantOnlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  vibrantDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vibrantWorkerName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  chatLastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // ── End chat island styles ────────────────────────────────────────────────────
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  chatTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  chatBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chatBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...SHADOWS.small,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chatMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 8,
  },
  // ⚡ Instant Job Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  instantModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    position: 'relative',
    ...SHADOWS.large,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
    lineHeight: 18,
  },
  instantModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    marginRight: 30,
  },
  instantModalMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 24,
  },
  instantModalBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  instantModalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});