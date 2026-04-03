import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { getJobById, JobDetail } from '@/services/workerService';

const FALLBACK_LOGO = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=100';

function formatSalary(min: number, max: number): string {
    if (!min && !max) return '';
    const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} / month`;
    if (min) return `${fmt(min)}+ / month`;
    return `Up to ${fmt(max)} / month`;
}

function InfoRow({ icon, value }: { icon: string; value: string }) {
    if (!value) return null;
    return (
        <View style={styles.infoRow}>
            <Feather name={icon as any} size={15} color={COLORS.primary} style={styles.infoIcon} />
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function TagList({ tags, color }: { tags: string[]; color?: string }) {
    if (!tags || tags.length === 0) return null;
    return (
        <View style={styles.tagRow}>
            {tags.map((tag, i) => (
                <View key={i} style={[styles.tag, color ? { backgroundColor: color + '18' } : undefined]}>
                    <Text style={[styles.tagText, color ? { color } : undefined]}>{tag}</Text>
                </View>
            ))}
        </View>
    );
}

export default function HirerJobDetailScreen() {
    const insets = useSafeAreaInsets();
    const { jobId } = useLocalSearchParams<{ jobId: string }>();
    const [job, setJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!jobId) {
            setError('Job not found.');
            setLoading(false);
            return;
        }
        getJobById(jobId)
            .then(setJob)
            .catch((e: any) => setError(e?.message ?? 'Failed to load job details.'))
            .finally(() => setLoading(false));
    }, [jobId]);

    const statusColor = job?.status === 'OPEN'
        ? COLORS.success ?? '#10B981'
        : job?.status === 'PAUSED' ? '#EA580C' : COLORS.textSecondary;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Job Details</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Feather name="alert-circle" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : job ? (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Business header */}
                    <View style={styles.bizHeader}>
                        <Image
                            source={{ uri: job.logoUrl || FALLBACK_LOGO }}
                            style={styles.logo}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bizName}>{job.businessName || 'My Business'}</Text>
                            <Text style={styles.jobRole}>{job.jobRole}</Text>
                            {!!job.position && <Text style={styles.position}>{job.position}</Text>}
                        </View>
                        {!!job.status && (
                            <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Key details */}
                    <View style={styles.card}>
                        <InfoRow icon="credit-card" value={formatSalary(job.salaryMinAmount, job.salaryMaxAmount)} />
                        <InfoRow icon="map-pin" value={[job.city, job.state].filter(Boolean).join(', ')} />
                        {!!job.locality && <InfoRow icon="navigation" value={job.locality} />}
                        {!!job.workingHours && <InfoRow icon="clock" value={`${job.workingHours} hrs / day`} />}
                        {!!job.workType && <InfoRow icon="briefcase" value={job.workType} />}
                        {!!job.experienceMin && <InfoRow icon="award" value={`${job.experienceMin}+ years experience`} />}
                        {!!job.vacancies && <InfoRow icon="users" value={`${job.vacancies} opening${job.vacancies !== 1 ? 's' : ''}`} />}
                        {!!job.weeklyLeaves && <InfoRow icon="calendar" value={`${job.weeklyLeaves} day${job.weeklyLeaves !== 1 ? 's' : ''} off / week`} />}
                    </View>

                    {/* Description */}
                    {!!job.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About this job</Text>
                            <Text style={styles.description}>{job.description}</Text>
                        </View>
                    )}

                    {/* Benefits */}
                    {job.benefits && job.benefits.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Benefits</Text>
                            <TagList tags={job.benefits} color={COLORS.success ?? '#10B981'} />
                        </View>
                    )}

                    {/* Preferred languages */}
                    {job.preferredLanguages && job.preferredLanguages.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Preferred Languages</Text>
                            <TagList tags={job.preferredLanguages} color={COLORS.primary} />
                        </View>
                    )}

                    {/* Availability / schedule */}
                    {job.availability && job.availability.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Work Schedule</Text>
                            <TagList tags={job.availability} />
                        </View>
                    )}

                    {/* Categories */}
                    {job.categories && job.categories.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Categories</Text>
                            <TagList tags={job.categories} />
                        </View>
                    )}

                    <View style={{ height: 32 }} />
                </ScrollView>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    errorText: { marginTop: 12, color: '#EF4444', fontSize: 15, textAlign: 'center' },
    scroll: { padding: 16, paddingBottom: 32 },
    bizHeader: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 14,
        backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
        ...SHADOWS.medium,
    },
    logo: { width: 60, height: 60, borderRadius: 12, backgroundColor: COLORS.border },
    bizName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
    jobRole: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
    position: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    statusBadge: {
        alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 3,
    },
    statusText: { fontSize: 12, fontWeight: '600' },
    card: {
        backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
        marginBottom: 12, gap: 10, ...SHADOWS.medium,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    infoIcon: { marginTop: 1 },
    infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '500', flex: 1 },
    section: {
        backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
        marginBottom: 12, ...SHADOWS.medium,
    },
    sectionTitle: {
        fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
    },
    description: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
        backgroundColor: COLORS.background, borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 5,
    },
    tagText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
});
