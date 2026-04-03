import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal, Switch, Platform, Linking, Animated, Dimensions } from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { MapPin, Calendar, Bell, Menu, MessageCircle, Briefcase, User as UserIcon, Search, Clipboard, ChevronRight, Plus, Settings, LogOut, Moon, Star, Lock, X, Phone, Globe, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { getProfileData, saveProfileData, clearAll, getAuthSession, getAuthToken } from '@/utils/storage';
import { getChatThreads, ChatThread, getMyHirerJobs, getHirerProfile, uploadHirerLogo, listWorkersForHirer, unlockWorkerContact, WorkerProfileResponse } from '@/services/workerService';
import { getUnreadCount } from '@/services/notificationService';
import { ApiError } from '@/services/apiClient';
import PrimaryButton from '@/components/PrimaryButton';
import TopNavBar from '@/components/TopNavBar';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import FadeInView from '@/components/FadeInView';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=100';

export default function WorkersListScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [menuVisible, setMenuVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [profileData, setProfileData] = useState<any>({});
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const [profileImage, setProfileImage] = useState<any>({ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop' });
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [businessName, setBusinessName] = useState<string>('');
  const [availableWorkers, setAvailableWorkers] = useState<WorkerProfileResponse[]>([]);
  const [hirerLatitude, setHirerLatitude] = useState<number | null>(null);
  const [hirerLongitude, setHirerLongitude] = useState<number | null>(null);
  const [contactingWorkerId, setContactingWorkerId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  // Ref holding the chat-list poll interval so it can be cleared without
  // restarting on every render (same stable-ref pattern as the chat thread screen).
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTabRef = useRef(activeTab);

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
        try { await uploadHirerLogo(newUri); } catch { /* non-fatal */ }
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
              try { await uploadHirerLogo(newUri); } catch { /* non-fatal */ }
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
              try { await uploadHirerLogo(newUri); } catch { /* non-fatal */ }
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

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  ];

  const { i18n } = useTranslation();
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  // Keep ref in sync so the poll callback always sees the current tab without
  // closing over a stale value.
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Silently refresh chat threads — used by the poll interval.
  const refreshChatThreads = useCallback(async () => {
    try {
      const result = await getChatThreads(1, 50);
      setChatThreads(result.data);
    } catch {
      // Ignore poll errors silently; the user is still on the screen.
    }
  }, []);

  // Start / stop the 5-second chat-list poll.
  // Extracted so both useFocusEffect and the tab-change useEffect can call it.
  const startChatPoll = useCallback(() => {
    if (chatPollRef.current) return; // already running
    chatPollRef.current = setInterval(refreshChatThreads, 5000);
  }, [refreshChatThreads]);

  const stopChatPoll = useCallback(() => {
    if (chatPollRef.current) {
      clearInterval(chatPollRef.current);
      chatPollRef.current = null;
    }
  }, []);

  // When the active tab changes to/from 'chats', start/stop the poll.
  useEffect(() => {
    if (activeTab === 'chats') {
      refreshChatThreads(); // immediate refresh when switching to Chats tab
      startChatPoll();
    } else {
      stopChatPoll();
    }
    return stopChatPoll;
  }, [activeTab, refreshChatThreads, startChatPoll, stopChatPoll]);

  // Fetch updated profile data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const session = await getAuthSession();
        const token = await getAuthToken();
        // Guard: require a hirer session with a stored JWT.
        // Checking role prevents a stale worker JWT from reaching hirer API
        // endpoints, where it would get a 403 that was previously swallowed silently.
        if (!session?.loggedIn || !token || session.role !== 'hirer') {
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
          const result = await getChatThreads(1, 50);
          setChatThreads(result.data);
        } catch (e: any) {
          handleAuthError(e);
        }
        try {
          const jobsResult = await getMyHirerJobs();
          setActiveJobs(jobsResult.data.map(j => ({
            id: j.id,
            title: j.roles?.length ? j.roles[0] : (j.jobRole || 'Job'),
            date: j.createdAt ? `Posted ${new Date(j.createdAt).toLocaleDateString()}` : '',
            salary: j.salaryMinAmount && j.salaryMaxAmount
              ? `₹${Math.round(j.salaryMinAmount / 1000)}k - ₹${Math.round(j.salaryMaxAmount / 1000)}k/mo`
              : '',
            type: j.workType || '',
            applied: 0,
            shortlisted: 0,
            interviews: 0,
            status: j.status === 'open' ? 'Active' : j.status === 'paused' ? 'Paused' : 'Active',
          })));
        } catch (e: any) {
          handleAuthError(e);
        }
        try {
          const profile = await getHirerProfile();
          if (profile?.businessName) setBusinessName(profile.businessName);
          if (profile?.logoUrl) setProfileImage({ uri: profile.logoUrl });
          if (profile?.latitude) setHirerLatitude(profile.latitude);
          if (profile?.longitude) setHirerLongitude(profile.longitude);
        } catch (e: any) {
          handleAuthError(e);
        }
        try {
          const workers = await listWorkersForHirer();
          setAvailableWorkers(workers);
        } catch (e: any) {
          handleAuthError(e);
        }
        // Refresh unread notification count for bell badge
        getUnreadCount().then(setUnreadCount).catch(() => {});

        // If already on the Chats tab when screen refocuses, restart the poll.
        if (activeTabRef.current === 'chats') {
          startChatPoll();
        }
      };
      loadProfile();

      // Stop the poll when the screen loses focus (e.g. user navigates to a chat thread).
      return stopChatPoll;
    }, [startChatPoll, stopChatPoll])
  );

  useEffect(() => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
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
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    }
  };

  const theme = {
    background: darkMode ? '#111827' : '#F9FAFB',
    card: darkMode ? '#1F2937' : COLORS.white,
    text: darkMode ? '#F9FAFB' : COLORS.text,
    textSecondary: darkMode ? '#9CA3AF' : COLORS.textSecondary,
    border: darkMode ? '#374151' : COLORS.borderLight,
    nav: darkMode ? '#1F2937' : COLORS.white,
    navBorder: darkMode ? '#374151' : COLORS.borderLight,
    navInactive: darkMode ? '#6B7280' : COLORS.navInactive,
  };

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

  const formatDistance = (workerLat: number | null, workerLon: number | null): string => {
    if (
      isValidCoord(hirerLatitude) && isValidCoord(hirerLongitude) &&
      isValidCoord(workerLat) && isValidCoord(workerLon)
    ) {
      const km = haversineKm(hirerLatitude, hirerLongitude, workerLat, workerLon);
      return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
    }
    return 'Distance unavailable';
  };

  // Navigate to the full worker profile detail screen (no subscription required).
  const handleViewProfile = (worker: WorkerProfileResponse) => {
    router.push({ pathname: '/hirer/worker-profile', params: { workerId: worker.id } });
  };

  // Build a WhatsApp deep-link with a prefilled message containing the worker's real details.
  const buildWorkerWhatsAppURL = (phone: string, worker: WorkerProfileResponse): string => {
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;

    const role = worker.selectedRoles?.[0] ?? '';
    const exp = worker.experienceYears > 0 ? `${worker.experienceYears} yr${worker.experienceYears !== 1 ? 's' : ''} experience` : 'Fresher';
    const location = [worker.city, worker.state].filter(Boolean).join(', ');

    let msg = `Hi, I found ${worker.fullName}'s profile on IndianMaster and I'm interested in hiring them.`;
    if (role) msg += `\nRole: ${role}`;
    msg += `\nExperience: ${exp}`;
    if (location) msg += `\nLocation: ${location}`;

    return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
  };

  // Attempt to unlock worker contact and open WhatsApp.
  // If no active subscription, redirects to the paywall.
  const handleContactWorker = async (worker: WorkerProfileResponse) => {
    if (contactingWorkerId) return; // prevent double-tap
    setContactingWorkerId(worker.id);
    try {
      const contact = await unlockWorkerContact(worker.id);
      const url = buildWorkerWhatsAppURL(contact.phone, worker);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'WhatsApp not available',
          `You can call or message this worker directly at: ${contact.phone}`,
        );
      }
    } catch (e: any) {
      if (e?.statusCode === 402) {
        // No active subscription — send hirer to paywall.
        router.push(`/hirer/subscription?workerId=${worker.id}`);
      } else {
        Alert.alert('Error', 'Could not contact worker. Please try again.');
      }
    } finally {
      setContactingWorkerId(null);
    }
  };

  const handleDeleteJob = (id: string) => {
    Alert.alert(
      t('deleteJob'),
      'Are you sure you want to delete this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: () => {
            setActiveJobs(prev => prev.filter(job => job.id !== id));
          }
        }
      ]
    );
  };

  const handleTogglePauseJob = (id: string) => {
    setActiveJobs(prev => prev.map(job => {
      if (job.id === id) {
        const newStatus = job.status === 'Active' ? 'Paused' : 'Active';
        Alert.alert(
          newStatus === 'Paused' ? t('pauseJob') : t('resumeJob'),
          newStatus === 'Paused' ? 'Job has been paused.' : 'Job has been resumed.'
        );
        return { ...job, status: newStatus };
      }
      return job;
    }));
  };

  // --- TAB CONTENT RENDERERS ---

  const renderExplore = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <FadeInView style={styles.floatingWorkspace}>
        <View style={styles.islandSurface}>
          <View style={styles.islandSection}>
            <View style={styles.sectionHeading}>
              <View style={[styles.accentRing, { borderColor: COLORS.primary }]} />
              <Text style={styles.islandSectionTitle}>{t('availableWorkers')}</Text>
            </View>

            {availableWorkers.length === 0 ? (
              <Text style={{ color: COLORS.textLight, textAlign: 'center', paddingVertical: 24 }}>
                No workers available right now.
              </Text>
            ) : availableWorkers.map((worker) => {
              const status = worker.availabilityStatus?.toLowerCase();
              const isAvailableNow = status === 'available';
              const isUnavailable = !status;
              const availabilityLabel = isUnavailable
                ? 'Availability unavailable'
                : isAvailableNow ? 'AVAILABLE NOW' : 'FROM MONDAY';
              const availabilityColor = isAvailableNow ? COLORS.success : COLORS.info;
              const photoUri = worker.profilePhotoUrl || FALLBACK_AVATAR;
              const displayRole = worker.selectedRoles?.length ? worker.selectedRoles[0] : 'Worker';
              const displayExperience = worker.experienceYears > 0 ? `${worker.experienceYears} yrs` : 'Fresher';
              const displayDistance = formatDistance(worker.liveLatitude, worker.liveLongitude);

              return (
                <TouchableOpacity
                  key={worker.id}
                  style={styles.vibrantWorkerCard}
                  onPress={() => handleViewProfile(worker)}
                  activeOpacity={0.9}
                >
                  <View style={styles.workerMainInfo}>
                    <View style={styles.vibrantPhotoBox}>
                      <Image source={{ uri: photoUri }} style={styles.vibrantPhoto} />
                      <View style={[styles.vibrantOnlineBadge, { backgroundColor: isUnavailable ? COLORS.border : availabilityColor }]} />
                    </View>

                    <View style={styles.vibrantDetails}>
                      <View style={styles.nameRow}>
                        <Text style={styles.vibrantWorkerName}>{worker.fullName || 'Worker'}</Text>
                        {!isUnavailable && (
                          <View style={[styles.miniBadge, { backgroundColor: availabilityColor + '15' }]}>
                            <Text style={[styles.miniBadgeText, { color: availabilityColor }]}>
                              {isAvailableNow ? 'Online' : 'Mon'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.vibrantWorkerRole}>{displayRole}</Text>

                      <View style={styles.vibrantMetaRow}>
                        <View style={styles.vibrantMetaItem}>
                          <MaterialCommunityIcons name="briefcase-clock-outline" size={14} color={COLORS.textLight} />
                          <Text style={styles.vibrantMetaText}>{displayExperience}</Text>
                        </View>
                        <View style={styles.vibrantMetaItem}>
                          <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.textLight} />
                          <Text style={styles.vibrantMetaText}>{displayDistance}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.arrowBox}>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
                    </View>
                  </View>

                  <View style={styles.vibrantCardFooter}>
                    <TouchableOpacity
                      style={styles.ghostAction}
                      onPress={() => handleViewProfile(worker)}
                    >
                      <Text style={styles.ghostActionText}>{t('viewProfile')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.vibrantAction, contactingWorkerId === worker.id && { opacity: 0.6 }]}
                      onPress={() => handleContactWorker(worker)}
                      disabled={contactingWorkerId === worker.id}
                    >
                      <Text style={styles.vibrantActionText}>{t('contactWorker')}</Text>
                      <MaterialCommunityIcons name="whatsapp" size={16} color={COLORS.white} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </FadeInView>
    </ScrollView>
  );

  const formatThreadTime = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

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
                  No conversations yet.{'\n'}Open a worker profile and tap{'\n'}"Send Message" to start chatting.
                </Text>
              </View>
            ) : chatThreads.map((thread) => {
              // For a hirer, hirerName is set to the worker's name by the backend
              const displayName = thread.hirerName || thread.workerName || `Worker ${thread.workerId.slice(0, 6)}`;
              const preview = thread.lastMessagePreview || 'Tap to view messages';
              return (
                <TouchableOpacity
                  key={thread.id}
                  style={styles.vibrantWorkerCard}
                  onPress={() => router.push({
                    pathname: '/chat/[id]',
                    params: { id: thread.id, name: displayName, image: FALLBACK_AVATAR }
                  })}
                  activeOpacity={0.9}
                >
                  <View style={styles.workerMainInfo}>
                    <View style={styles.vibrantPhotoBox}>
                      <Image source={{ uri: FALLBACK_AVATAR }} style={styles.vibrantPhoto} />
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

  const renderJobs = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <FadeInView style={styles.floatingWorkspace}>
        <View style={styles.islandSurface}>
          <View style={styles.islandSection}>
            <View style={styles.sectionHeading}>
              <View style={[styles.accentRing, { borderColor: '#FF9800' }]} />
              <Text style={styles.islandSectionTitle}>{t('activeJobs')}</Text>
              <TouchableOpacity onPress={() => router.push('/hirer/job-posting')}>
                <Text style={styles.seeAllText}>{t('createNew')}</Text>
              </TouchableOpacity>
            </View>

            {activeJobs.length > 0 ? activeJobs.map(job => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobDate}>{job.date}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={[styles.statusBadge, { backgroundColor: job.status === 'Active' ? '#ECFDF5' : '#FFF7ED' }]}>
                      <Text style={[styles.statusText, { color: job.status === 'Active' ? '#059669' : '#EA580C' }]}>
                        {job.status === 'Active' ? t('jobActive') || 'Active' : t('jobPaused') || 'Paused'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleTogglePauseJob(job.id)} style={{ padding: 4 }}>
                      <MaterialCommunityIcons
                        name={job.status === 'Active' ? "pause-circle-outline" : "play-circle-outline"}
                        size={22}
                        color={job.status === 'Active' ? "#EA580C" : "#16A34A"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteJob(job.id)} style={{ padding: 4 }}>
                      <MaterialCommunityIcons name="delete-outline" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.jobDetails}>
                  <Text style={styles.jobDetailText}>{job.salary}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.jobDetailText}>{job.type}</Text>
                </View>
                <View style={styles.jobStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{job.applied}</Text>
                    <Text style={styles.statLabel}>Applied</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{job.shortlisted}</Text>
                    <Text style={styles.statLabel}>Shortlisted</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{job.interviews}</Text>
                    <Text style={styles.statLabel}>Interviews</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
                  <TouchableOpacity
                    style={[styles.manageButton, { flex: 1 }]}
                    onPress={() => router.push({ pathname: '/hirer/job-detail', params: { jobId: job.id } })}
                  >
                    <Text style={styles.manageButtonText}>View Job</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.manageButton, { flex: 1 }]} onPress={() => router.push({ pathname: '/hirer/manage-job', params: { jobId: job.id, jobTitle: job.title } })}>
                    <Text style={styles.manageButtonText}>Manage Job</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.manageButton, { flex: 1, backgroundColor: COLORS.primary }]}
                    onPress={() => router.push({ pathname: '/hirer/job-applicants', params: { jobId: job.id, jobTitle: job.title } })}
                  >
                    <Text style={[styles.manageButtonText, { color: COLORS.white }]}>Applicants</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <MaterialCommunityIcons name="briefcase-variant-outline" size={48} color={COLORS.textLight} />
                <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>No active jobs found</Text>
              </View>
            )}

            {/* Post Job Button (Prominent) */}
            <View style={[styles.sectionHeading, { marginTop: 24 }]}>
              <View style={[styles.accentRing, { borderColor: COLORS.primary }]} />
              <Text style={styles.islandSectionTitle}>Post New</Text>
            </View>

            <TouchableOpacity
              style={styles.createJobCard}
              onPress={() => router.push('/hirer/job-posting')}
            >
              <View style={styles.createIconContainer}>
                <Plus size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.createJobTitle}>Post job</Text>
              <Text style={styles.createJobSubtitle}>Find the perfect candidate required for your restaurant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </FadeInView>
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <FadeInView style={styles.floatingWorkspace}>
        <View style={styles.islandSurface}>
          <View style={styles.islandSection}>
            <View style={styles.profileHeaderCard}>
              <View style={styles.profileImageContainer}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
                  <Image
                    source={profileImage}
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cameraIconBadge}
                  onPress={pickImage}
                >
                  <Plus size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{businessName || profileData?.businessName || 'Your Business'}</Text>
                <Text style={styles.profileLocation}>{profileData?.city || ''}</Text>
                <TouchableOpacity
                  style={styles.editProfileButton}
                  onPress={() => router.push('/hirer/restaurant-setup')}
                >
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('Settings', 'App settings coming soon!')}
              >
                <View style={styles.menuIconContainer}>
                  <Settings size={20} color={COLORS.secondary} />
                </View>
                <Text style={styles.menuText}>Settings</Text>
                <ChevronRight size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/hirer/subscription')}>
                <View style={styles.menuIconContainer}>
                  <Briefcase size={20} color={COLORS.secondary} />
                </View>
                <Text style={styles.menuText}>{t('subscription')}</Text>
                <ChevronRight size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
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
                <View style={[styles.menuIconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <LogOut size={20} color={COLORS.error} />
                </View>
                <Text style={[styles.menuText, { color: COLORS.error }]}>{t('logout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </FadeInView>
    </ScrollView>
  );

  // --- DYNAMIC HEADER INFO ---

  const getPageInfo = () => {
    switch (activeTab) {
      case 'explore': return { title: t('availableWorkers'), subtitle: t('restaurantLocationSubtitle') };
      case 'chats': return { title: t('chats'), subtitle: t('connectWithWorkersSubtitle') };
      case 'jobs': return { title: t('jobs'), subtitle: t('manageCareerProfile') };
      case 'profile': return { title: t('profile'), subtitle: t('manageAccountSubtitle') };
      default: return { title: t('availableWorkers'), subtitle: '' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <View style={[styles.container, { backgroundColor: COLORS.white }]}>
      <StatusBar style="light" />

      {/* Header Area */}
      <View style={styles.headerContainer}>
        {/* White Top Nav — shared component */}
        <TopNavBar unreadCount={unreadCount} onMenuPress={() => toggleMenu(true)} />

        {/* Blue Vibrant Hero */}
        <View style={styles.vibrantHeader}>
          <View style={styles.headerHero}>
            <View style={styles.heroTextBox}>
              <Text style={styles.vibrantTitle}>{title}</Text>
              <Text style={styles.vibrantSubtitle}>{subtitle}</Text>

              {activeTab === 'explore' && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#FFFFFF',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onPress={() => router.push('/hirer/restaurant-setup')}
                  >
                    <Briefcase size={16} color={COLORS.primary || '#e63946'} />
                    <Text style={{ color: COLORS.primary || '#e63946', fontWeight: '700', fontSize: 13 }}>Post Job</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      backgroundColor: '#FFFFFF',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onPress={() => router.push('/hirer/subscription')}
                  >
                    <Star size={16} color={COLORS.primary || '#e63946'} />
                    <Text style={{ color: COLORS.primary || '#e63946', fontWeight: '700', fontSize: 13 }}>Subscription</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.heroIconBox}>
              {activeTab === 'explore' && <Search size={32} color="rgba(255,255,255,0.3)" />}
              {activeTab === 'chats' && <MessageCircle size={32} color="rgba(255,255,255,0.3)" />}
              {activeTab === 'jobs' && <Briefcase size={32} color="rgba(255,255,255,0.3)" />}
              {activeTab === 'profile' && <UserIcon size={32} color="rgba(255,255,255,0.3)" />}
            </View>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      {activeTab === 'explore' && renderExplore()}
      {activeTab === 'chats' && renderChats()}
      {activeTab === 'jobs' && renderJobs()}
      {activeTab === 'profile' && renderProfile()}

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, {
        backgroundColor: COLORS.white,
        paddingBottom: insets.bottom + 10,
        height: 60 + (insets.bottom > 0 ? insets.bottom : 10)
      }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('explore')}
        >
          <Search size={22} color={activeTab === 'explore' ? COLORS.primary : COLORS.navInactive} />
          <Text style={[styles.navLabel, activeTab === 'explore' && styles.navLabelActive, { color: activeTab === 'explore' ? COLORS.primary : COLORS.navInactive }]}>
            {t('explore').toUpperCase()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('chats')}
        >
          <MessageCircle size={22} color={activeTab === 'chats' ? COLORS.primary : COLORS.navInactive} />
          <Text style={[styles.navLabel, activeTab === 'chats' && styles.navLabelActive, { color: activeTab === 'chats' ? COLORS.primary : COLORS.navInactive }]}>
            {t('chats').toUpperCase()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('jobs')}
        >
          <Clipboard size={22} color={activeTab === 'jobs' ? COLORS.primary : COLORS.navInactive} />
          <Text style={[styles.navLabel, activeTab === 'jobs' && styles.navLabelActive, { color: activeTab === 'jobs' ? COLORS.primary : COLORS.navInactive }]}>
            {t('myJob').toUpperCase()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('profile')}
        >
          <UserIcon size={22} color={activeTab === 'profile' ? COLORS.primary : COLORS.navInactive} />
          <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive, { color: activeTab === 'profile' ? COLORS.primary : COLORS.navInactive }]}>
            {t('profile').toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Menu Modal - Right Side Drawer */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => toggleMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            activeOpacity={1}
            onPress={() => toggleMenu(false)}
          />
          <Animated.View
            style={[
              styles.menuDrawer,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={[styles.menuHeader, { paddingTop: insets.top + 20 }]}>
              <View style={styles.menuHeaderContent}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.drawerLogo}
                  resizeMode="contain"
                />
              </View>
              <TouchableOpacity onPress={() => toggleMenu(false)} style={styles.drawerCloseButton}>
                <X size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.drawerSection}>
                <Text style={styles.drawerSectionTitle}>{t('profile')}</Text>
                <TouchableOpacity style={styles.menuRow} onPress={() => { toggleMenu(false); setActiveTab('profile'); }}>
                  <UserIcon size={20} color={COLORS.secondary} />
                  <Text style={styles.menuRowText}>{t('profile')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={() => { toggleMenu(false); router.push('/hirer/subscription'); }}>
                  <Briefcase size={20} color={COLORS.secondary} />
                  <Text style={styles.menuRowText}>{t('subscription')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={() => { toggleMenu(false); Alert.alert('Saved Workers', 'No saved workers yet.'); }}>
                  <Star size={20} color={COLORS.secondary} />
                  <Text style={styles.menuRowText}>{t('savedWorkers')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    toggleMenu(false);
                    setLangModalVisible(true);
                  }}
                >
                  <Globe size={20} color={COLORS.secondary} />
                  <Text style={styles.menuRowText}>{t('language') || 'Language'}: {currentLang.label}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.drawerDivider} />

              <View style={styles.drawerSection}>
                <Text style={styles.drawerSectionTitle}>{t('supportBtn')}</Text>
                <TouchableOpacity style={styles.menuRow} onPress={() => { toggleMenu(false); router.push('/hirer/help-support'); }}>
                  <Feather name="help-circle" size={20} color={COLORS.secondary} />
                  <Text style={styles.menuRowText}>{t('helpSupport')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={() => { toggleMenu(false); Alert.alert('Privacy & Terms', 'Privacy Policy and Terms of Service...'); }}>
                  <Lock size={20} color={COLORS.secondary} />
                  <Text style={styles.menuRowText}>{t('privacyTerms')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.drawerDivider} />

              <TouchableOpacity
                style={[styles.menuRow, { marginTop: 10 }]}
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
                <View style={styles.logoutIconBox}>
                  <LogOut size={20} color={COLORS.error} />
                </View>
                <Text style={[styles.menuRowText, { color: COLORS.error }]}>{t('logout')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

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
    backgroundColor: '#FFFFFF',
  },
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 0,
    paddingRight: 24,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
  },
  headerLogo: {
    width: 185,
    height: 62,
    marginLeft: -30,
  },
  headerActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.white,
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    flex: 1,
  },

  // Vibrant Worker Card
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
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  vibrantWorkerRole: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  vibrantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  vibrantMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vibrantMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  vibrantCardFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ghostAction: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  ghostActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  vibrantAction: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vibrantActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderTopWidth: 1.5,
    borderTopColor: '#F1F5F9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    ...SHADOWS.medium,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
  },
  modalCloseArea: {
    flex: 1,
  },
  menuDrawer: {
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
  drawerLogo: {
    width: 130,
    height: 45,
    marginLeft: -5,
  },
  drawerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerSection: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  drawerSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  drawerDivider: {
    height: 1.5,
    backgroundColor: '#F8FAFC',
    marginVertical: 15,
  },
  logoutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  menuHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  menuDivider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 24,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 16,
  },
  menuRowText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  menuIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: {
    fontSize: 12,
    fontWeight: '900',
  },

  // Legacy/Other styles
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    ...SHADOWS.small,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  jobDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  statusBadge: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.success,
  },
  jobDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  jobDetailText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dot: {
    fontSize: 14,
    color: COLORS.border,
    marginHorizontal: 8,
  },
  jobStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 2,
  },
  verticalDivider: {
    width: 1.5,
    backgroundColor: '#E2E8F0',
  },
  manageButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  createJobCard: {
    backgroundColor: COLORS.primary + '05',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
    borderStyle: 'dashed',
  },
  createIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  createJobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  createJobSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 20,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOWS.small,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  editProfileButton: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    ...SHADOWS.small,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
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
    borderRadius: 32,
    padding: 24,
    ...SHADOWS.large,
  },
  langModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  langModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
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
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  langOptionActive: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  langLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  langLabelActive: {
    color: COLORS.primary,
  },
  langNative: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chatLastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
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
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '700',
  },
});
