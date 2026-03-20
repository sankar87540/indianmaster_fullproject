import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image, Alert, Platform, Linking, TextInput, KeyboardAvoidingView, Keyboard, Animated, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { MapPin, Clock, DollarSign, Building, Briefcase, Search, MessageCircle, User as UserIcon, Settings, LogOut, ChevronRight, Star, Camera, Plus, Clipboard } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import { getProfileData, saveProfileData, clearAll, getAuthSession } from '@/utils/storage';
import React, { useCallback, useEffect, useRef } from 'react';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import ProgressIndicator from '@/components/ProgressIndicator';
import { getJobsFeed, getWorkerProfile, applyToJob, getMyApplications, getChatThreads, submitInstantApplication, JobFeedItem, ChatThread } from '@/services/workerService';
import { ApiError } from '@/services/apiClient';
import { COLORS, SHADOWS } from '@/constants/theme';

const FALLBACK_CHAT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=100';

export default function JobsFeedScreen() {
  const { t } = useTranslation();
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
        if (!session?.loggedIn) {
          router.replace('/');
          return;
        }
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
        } catch {
          // fall back to profileData
        }
        try {
          const result = await getJobsFeed(1, 20);
          setFeedJobs(result.data);
        } catch {
          // keep empty list
        }
        try {
          const appResult = await getMyApplications(1, 100);
          setAppliedJobs(appResult.data.map((a) => a.jobId));
        } catch {
          // keep current applied state
        }
        try {
          const chatResult = await getChatThreads(1, 20);
          setChatThreads(chatResult.data);
        } catch {
          // keep empty list
        }
      };
      loadProfile();
    }, [])
  );

  useEffect(() => {
    if (params.initialTab) {
      setActiveTab(params.initialTab as string);
    }
  }, [params.initialTab]);

  // Prefer backend-computed value; fall back to route param → AsyncStorage → default 40
  const completionPercentage = workerProfile?.completionPercentage
    ?? (params.completionPercentage
      ? parseInt(params.completionPercentage as string)
      : (profileData?.completionPercentage ? parseInt(profileData.completionPercentage) : 40));
  const isProfileComplete = completionPercentage === 100;

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled) {
        const newUri = result.assets[0].uri;
        setProfileImage({ uri: newUri });
        await saveProfileData({ profileImage: newUri });
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
              const newUri = result.assets[0].uri;
              setProfileImage({ uri: newUri });
              await saveProfileData({ profileImage: newUri });
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
              const newUri = result.assets[0].uri;
              setProfileImage({ uri: newUri });
              await saveProfileData({ profileImage: newUri });
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
    Alert.alert('Job Details', 'Full job details would open here.');
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
        Alert.alert('Success', `Successfully uploaded: ${result.assets[0].name}`);
        // Optionally save to profileData here or API call
      }
    } catch (err) {
      console.error("Error picking document", err);
      Alert.alert('Error', 'Failed to pick resume document');
    }
  };

  // --- HELPERS ---

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

        return (
          <Card
            key={job.id}
            style={[
              styles.jobCard,
              isSmallScreen && styles.jobCardSmall
            ]}
          >
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
                  <DollarSign size={isSmallScreen ? 14 : 16} color={COLORS.success} />
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
                    {location}
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
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>{t('chats')}</Text>
        {totalUnread > 0 && (
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>{totalUnread} New</Text>
          </View>
        )}
      </View>
      {chatThreads.length === 0 ? (
        <View style={styles.centerContent}>
          <MessageCircle size={48} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>Hirers who contact you will appear here</Text>
        </View>
      ) : chatThreads.map((thread) => {
        const displayName = thread.hirerName || `Hirer ${thread.hirerId.slice(0, 6)}`;
        const preview = thread.lastMessagePreview || 'Tap to view messages';
        return (
          <TouchableOpacity
            key={thread.id}
            style={styles.chatItem}
            onPress={() => router.push({
              pathname: '/chat/[id]',
              params: { id: thread.id, name: displayName, image: FALLBACK_CHAT_IMAGE }
            })}
          >
            <Image source={{ uri: FALLBACK_CHAT_IMAGE }} style={styles.chatAvatar} />
            <View style={styles.chatInfo}>
              <View style={styles.chatNameRow}>
                <Text style={styles.chatName}>{displayName}</Text>
                <Text style={styles.chatTime}>{formatThreadTime(thread.lastMessageAt)}</Text>
              </View>
              <View style={styles.chatMessageRow}>
                <Text style={styles.chatMessage} numberOfLines={1}>{preview}</Text>
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
      Alert.alert('Application Sent!', 'Your application has been submitted successfully.');
      setFormData({ name: '', phone: '', role: '', experience: '', location: '', companyName: '' });
      setInstantJobModalVisible(false);
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
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#E0E7FF' }]}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#4338CA" />
          </View>
          <Text style={styles.menuText}>{t('workerProfile.uploadResume')}</Text>
          <ChevronRight size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

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
      {/* Header handled manually instead of AppHeader inside render to control title */}
      <AppHeader showNotification={true} />

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

      <View style={[
        styles.header,
        isSmallScreen && styles.headerSmall
      ]}>
        {activeTab === 'jobs' && (
          <TouchableOpacity
            style={styles.completionContainer}
            onPress={() => {
              if (!isProfileComplete) {
                router.push('/worker/profile-setup');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.completionHeader}>
              <Text style={styles.completionTitle}>{t('workerProfile.profileCompletion')}</Text>
              <Text style={styles.completionPercent}>{completionPercentage}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
            </View>
            <Text style={styles.completionSubtext}>
              {isProfileComplete
                ? t('workerProfile.profileCompletedMsg')
                : t('workerProfile.completeProfilePrompt')}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, isSmallScreen && styles.titleSmall]}>{title}</Text>
        <Text style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}>{subtitle}</Text>
      </View>

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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerSmall: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  titleSmall: {
    fontSize: 20,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  subtitleSmall: {
    fontSize: 14,
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
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  // --- Chat Styles ---
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
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  completionContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  completionPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  completionSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
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