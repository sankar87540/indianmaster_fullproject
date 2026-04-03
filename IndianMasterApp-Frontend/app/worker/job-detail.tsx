import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    ActivityIndicator, Alert
} from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import AppHeader from '@/components/AppHeader';
import { getJobById, JobDetail, applyToJob, getMyApplications } from '@/services/workerService';
import { ApiError } from '@/services/apiClient';
import { Feather } from '@expo/vector-icons';

const FALLBACK_LOGO = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=100';

function formatSalary(min: number, max: number): string {
    if (!min && !max) return '';
    const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} / month`;
    if (min) return `${fmt(min)}+ / month`;
    return `Up to ${fmt(max)} / month`;
}

function InfoRow({ icon, label, value }: { icon: string; label?: string; value: string }) {
    if (!value) return null;
    return (
        <View style={styles.infoRow}>
            <Feather name={icon as any} size={15} color={COLORS.primary} style={styles.infoIcon} />
            <View style={{ flex: 1 }}>
                {!!label && <Text style={styles.infoLabel}>{label}</Text>}
                <Text style={styles.infoValue}>{value}</Text>
            </View>
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

export default function JobDetailScreen() {
    const { jobId } = useLocalSearchParams<{ jobId: string }>();
    const [job, setJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasApplied, setHasApplied] = useState(false);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        if (!jobId) {
            setError('Job not found.');
            setLoading(false);
            return;
        }
        const load = async () => {
            try {
                const [jobData, appsData] = await Promise.all([
                    getJobById(jobId),
                    getMyApplications(),
                ]);
                setJob(jobData);
                const applied = (appsData.data ?? []).some((a) => a.jobId === jobId);
                setHasApplied(applied);
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load job details.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [jobId]);

    const handleApply = async () => {
        if (!jobId || hasApplied || applying) return;
        setApplying(true);
        try {
            await applyToJob(jobId);
            setHasApplied(true);
            Alert.alert(
                'Success',
                'Successfully Applied',
                [{ text: 'OK', onPress: () => router.push('/worker/job-applied-success') }]
            );
        } catch (e) {
            if (e instanceof ApiError && e.statusCode === 409) {
                setHasApplied(true);
                Alert.alert('Already Applied', 'You have already applied to this job.');
            } else {
                Alert.alert('Error', 'Failed to apply. Please try again.');
            }
        } finally {
            setApplying(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <AppHeader showBack />

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
                <>
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        {/* Business header */}
                        <View style={styles.bizHeader}>
                            <Image
                                source={{ uri: job.logoUrl || FALLBACK_LOGO }}
                                style={styles.logo}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.bizName}>{job.businessName || 'Business'}</Text>
                                <Text style={styles.jobRole}>{job.jobRole}</Text>
                                {!!job.position && <Text style={styles.position}>{job.position}</Text>}
                            </View>
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

                        {/* Availability */}
                        {job.availability && job.availability.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Work Schedule</Text>
                                <TagList tags={job.availability} />
                            </View>
                        )}

                        {/* Categories / roles */}
                        {job.categories && job.categories.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Categories</Text>
                                <TagList tags={job.categories} />
                            </View>
                        )}

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Sticky Apply button */}
                    <View style={styles.applyBar}>
                        <TouchableOpacity
                            style={[styles.applyBtn, (hasApplied || applying) && styles.applyBtnDisabled]}
                            onPress={handleApply}
                            disabled={hasApplied || applying}
                            activeOpacity={0.8}
                        >
                            {applying ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.applyBtnText}>
                                    {hasApplied ? 'Applied ✓' : 'Apply Now'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    errorText: {
        marginTop: 12,
        color: '#EF4444',
        fontSize: 15,
        textAlign: 'center',
    },
    scroll: {
        padding: 16,
        paddingBottom: 32,
    },
    bizHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...SHADOWS.medium,
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: COLORS.border,
    },
    bizName: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
    },
    jobRole: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    position: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 10,
        ...SHADOWS.medium,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    infoIcon: {
        marginTop: 1,
    },
    infoLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...SHADOWS.medium,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 22,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: COLORS.border + '30',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '500',
    },
    applyBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 14,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    applyBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyBtnDisabled: {
        backgroundColor: COLORS.textSecondary ?? '#94A3B8',
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
