import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import AppHeader from '@/components/AppHeader';
import { getJobApplicants, ApplicantDetail } from '@/services/workerService';
import { Feather, Ionicons } from '@expo/vector-icons';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100';

function statusColor(status: string): string {
    switch (status) {
        case 'shortlisted': return '#10B981';
        case 'rejected': return '#EF4444';
        case 'accepted': return '#6366F1';
        default: return '#F59E0B'; // pending
    }
}

function formatSalary(min: number, max: number): string {
    if (!min && !max) return '';
    if (min && max) return `₹${Math.round(min / 1000)}k – ₹${Math.round(max / 1000)}k/mo`;
    if (min) return `₹${Math.round(min / 1000)}k+/mo`;
    return `Up to ₹${Math.round(max / 1000)}k/mo`;
}

export default function JobApplicantsScreen() {
    const { jobId, jobTitle } = useLocalSearchParams<{ jobId: string; jobTitle: string }>();
    const [applicants, setApplicants] = useState<ApplicantDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!jobId) {
            setError('No job selected.');
            setLoading(false);
            return;
        }
        const load = async () => {
            try {
                const result = await getJobApplicants(jobId);
                setApplicants(result.data ?? []);
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load applicants.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [jobId]);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <AppHeader showBack />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Applicants</Text>
                {!!jobTitle && <Text style={styles.headerSubtitle}>{jobTitle}</Text>}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={48} color={COLORS.error ?? '#EF4444'} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : applicants.length === 0 ? (
                <View style={styles.center}>
                    <Feather name="users" size={56} color={COLORS.border} />
                    <Text style={styles.emptyTitle}>No applicants yet</Text>
                    <Text style={styles.emptySubtitle}>Workers who apply will appear here.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    <Text style={styles.countLabel}>{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</Text>
                    {applicants.map((applicant) => (
                        <View key={applicant.applicationId} style={styles.card}>
                            <View style={styles.cardTop}>
                                <Image
                                    source={{ uri: applicant.profilePhotoUrl || FALLBACK_AVATAR }}
                                    style={styles.avatar}
                                />
                                <View style={styles.cardInfo}>
                                    <Text style={styles.name}>{applicant.fullName || 'Unknown Worker'}</Text>
                                    {!!(applicant.city || applicant.state) && (
                                        <View style={styles.row}>
                                            <Feather name="map-pin" size={12} color={COLORS.textSecondary} />
                                            <Text style={styles.meta}>
                                                {[applicant.city, applicant.state].filter(Boolean).join(', ')}
                                            </Text>
                                        </View>
                                    )}
                                    {!!formatSalary(applicant.expectedSalaryMin, applicant.expectedSalaryMax) && (
                                        <View style={styles.row}>
                                            <Text style={styles.meta}>
                                                {formatSalary(applicant.expectedSalaryMin, applicant.expectedSalaryMax)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusColor(applicant.status) + '22' }]}>
                                    <Text style={[styles.statusText, { color: statusColor(applicant.status) }]}>
                                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.contactRow}>
                                {!!applicant.phone && (
                                    <TouchableOpacity
                                        style={styles.contactBtn}
                                        onPress={() => Alert.alert('Contact Worker', `Phone: ${applicant.phone}`)}
                                    >
                                        <Feather name="phone" size={14} color={COLORS.primary} />
                                        <Text style={styles.contactBtnText}>{applicant.phone}</Text>
                                    </TouchableOpacity>
                                )}
                                {!!applicant.email && (
                                    <TouchableOpacity
                                        style={styles.contactBtn}
                                        onPress={() => Alert.alert('Contact Worker', `Email: ${applicant.email}`)}
                                    >
                                        <Feather name="mail" size={14} color={COLORS.primary} />
                                        <Text style={styles.contactBtnText} numberOfLines={1}>{applicant.email}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text style={styles.appliedAt}>
                                Applied {new Date(applicant.appliedAt).toLocaleDateString()}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 2,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    errorText: {
        marginTop: 12,
        color: COLORS.error ?? '#EF4444',
        fontSize: 15,
        textAlign: 'center',
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    emptySubtitle: {
        marginTop: 6,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    list: {
        padding: 16,
        paddingBottom: 40,
    },
    countLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...SHADOWS.medium,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.border,
    },
    cardInfo: {
        flex: 1,
        gap: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    meta: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.borderLight ?? '#F1F5F9',
        marginVertical: 12,
    },
    contactRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.primaryLight ?? '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flex: 1,
    },
    contactBtnText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
        flex: 1,
    },
    appliedAt: {
        marginTop: 10,
        fontSize: 12,
        color: COLORS.textLight ?? '#94A3B8',
    },
});
