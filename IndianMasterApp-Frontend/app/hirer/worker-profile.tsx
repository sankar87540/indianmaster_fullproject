import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Briefcase, Lock, MessageCircle } from 'lucide-react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '@/constants/theme';
import {
  getWorkerProfileForHirer,
  unlockWorkerContact,
  openChatThread,
  WorkerProfileResponse,
} from '@/services/workerService';
import { ApiError } from '@/services/apiClient';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=200';

export default function WorkerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { workerId } = useLocalSearchParams<{ workerId: string }>();

  const [worker, setWorker] = useState<WorkerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contacting, setContacting] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    if (!workerId) return;
    (async () => {
      try {
        const profile = await getWorkerProfileForHirer(workerId);
        setWorker(profile);
      } catch (e) {
        setError('Could not load worker profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [workerId]);

  const handleStartChat = async () => {
    if (!worker || openingChat) return;
    setOpeningChat(true);
    try {
      const thread = await openChatThread(worker.userId);
      router.push({
        pathname: '/chat/[id]',
        params: { id: thread.id, name: worker.fullName || 'Worker' },
      });
    } catch {
      Alert.alert('Error', 'Could not open chat. Please try again.');
    } finally {
      setOpeningChat(false);
    }
  };

  const handleContactWorker = async () => {
    if (!worker || contacting) return;
    setContacting(true);
    try {
      const contact = await unlockWorkerContact(worker.id);
      if (contact.whatsappUrl) {
        await Linking.openURL(contact.whatsappUrl);
      }
    } catch (e: any) {
      if (e instanceof ApiError && e.statusCode === 402) {
        router.push(`/hirer/subscription?workerId=${worker.id}`);
      } else {
        Alert.alert('Error', 'Could not contact worker. Please try again.');
      }
    } finally {
      setContacting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !worker) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || 'Worker not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roleLabel = worker.selectedRoles?.length ? worker.selectedRoles[0] : 'Worker';
  const expLabel = worker.experienceYears > 0 ? `${worker.experienceYears} yrs exp` : 'Fresher';
  const locationLabel = [worker.city, worker.state].filter(Boolean).join(', ') || worker.address || 'Location not set';
  const availability = worker.availabilityStatus === 'available' ? 'Available Now' : 'Not immediately available';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Photo + name */}
        <View style={styles.heroCard}>
          <Image
            source={{ uri: worker.profilePhotoUrl || FALLBACK_AVATAR }}
            style={styles.photo}
          />
          <Text style={styles.name}>{worker.fullName || 'Worker'}</Text>
          <Text style={styles.roleText}>{roleLabel}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Briefcase size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{expLabel}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{locationLabel}</Text>
            </View>
          </View>

          <View style={[styles.availBadge, {
            backgroundColor: worker.availabilityStatus === 'available' ? COLORS.success + '15' : COLORS.warning + '15',
          }]}>
            <View style={[styles.dot, {
              backgroundColor: worker.availabilityStatus === 'available' ? COLORS.success : COLORS.warning,
            }]} />
            <Text style={[styles.availText, {
              color: worker.availabilityStatus === 'available' ? COLORS.success : COLORS.warning,
            }]}>{availability}</Text>
          </View>
        </View>

        {/* Details */}
        {!!(worker.gender || worker.age) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            {worker.gender ? <InfoRow label="Gender" value={worker.gender} /> : null}
            {worker.age ? <InfoRow label="Age" value={`${worker.age} years`} /> : null}
          </View>
        )}

        {worker.selectedRoles?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Roles</Text>
            <View style={styles.chipRow}>
              {worker.selectedRoles.map((r, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {worker.workTypes?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Types</Text>
            <View style={styles.chipRow}>
              {worker.workTypes.map((w, i) => (
                <View key={i} style={[styles.chip, styles.chipSecondary]}>
                  <Text style={[styles.chipText, styles.chipTextSecondary]}>{w}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {worker.languagesKnown?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.chipRow}>
              {worker.languagesKnown.map((l, i) => (
                <View key={i} style={[styles.chip, styles.chipSecondary]}>
                  <Text style={[styles.chipText, styles.chipTextSecondary]}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {!!(worker.educationLevel || worker.degree) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {worker.educationLevel ? <InfoRow label="Level" value={worker.educationLevel} /> : null}
            {worker.degree ? <InfoRow label="Degree" value={worker.degree} /> : null}
            {worker.college ? <InfoRow label="College" value={worker.college} /> : null}
          </View>
        )}

        {(worker.expectedSalaryMin || worker.expectedSalaryMax) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expected Salary</Text>
            <InfoRow
              label="Range"
              value={`₹${worker.expectedSalaryMin?.toLocaleString() ?? '—'} – ₹${worker.expectedSalaryMax?.toLocaleString() ?? '—'} / month`}
            />
          </View>
        ) : null}

        {/* Contact gating notice */}
        <View style={styles.contactNotice}>
          <Lock size={16} color={COLORS.textSecondary} />
          <Text style={styles.contactNoticeText}>
            Phone number is hidden. Subscribe to view contact details and message on WhatsApp.
          </Text>
        </View>

        {/* In-app chat button */}
        <TouchableOpacity
          style={[styles.chatBtn, openingChat && { opacity: 0.6 }]}
          onPress={handleStartChat}
          disabled={openingChat}
          activeOpacity={0.85}
        >
          {openingChat ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <MessageCircle size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.chatBtnText}>Send Message</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Contact button */}
        <TouchableOpacity
          style={[styles.contactBtn, contacting && { opacity: 0.6 }]}
          onPress={handleContactWorker}
          disabled={contacting}
          activeOpacity={0.85}
        >
          {contacting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="whatsapp" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.contactBtnText}>Contact on WhatsApp</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: COLORS.error, fontSize: 15, marginBottom: 16, textAlign: 'center' },
  backBtn: { paddingVertical: 10, paddingHorizontal: 24, backgroundColor: COLORS.primary, borderRadius: 8 },
  backBtnText: { color: COLORS.white, fontWeight: '600' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },

  scroll: { paddingBottom: 32 },

  heroCard: {
    backgroundColor: COLORS.white, margin: 16, borderRadius: 16,
    alignItems: 'center', padding: 24,
    ...SHADOWS.medium,
  },
  photo: { width: 90, height: 90, borderRadius: 45, marginBottom: 12, backgroundColor: COLORS.border },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4, textAlign: 'center' },
  roleText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12, textAlign: 'center' },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: '600' },

  section: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, padding: 16, ...SHADOWS.small,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chipSecondary: { backgroundColor: COLORS.secondaryLight },
  chipText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  chipTextSecondary: { color: COLORS.textSecondary },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '500', flex: 1, textAlign: 'right' },

  contactNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 16, marginTop: 16, padding: 12,
    backgroundColor: COLORS.secondaryLight, borderRadius: 10,
  },
  contactNoticeText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },

  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  chatBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },

  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#25D366', marginHorizontal: 16, marginTop: 12,
    paddingVertical: 14, borderRadius: 12,
    ...SHADOWS.medium,
  },
  contactBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
