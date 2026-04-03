import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Clipboard, User as UserIcon, X, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
    getJobApplicants,
    updateHirerJob,
    deleteHirerJob,
    updateApplicationStatusByHirer,
    type ApplicantDetail,
} from '@/services/workerService';

type FilterTab = 'All' | 'Shortlisted' | 'Recent';

export default function ManageJobScreen() {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { jobId, jobTitle } = useLocalSearchParams<{ jobId: string; jobTitle: string }>();

    const [jobStatus, setJobStatus] = useState<'OPEN' | 'PAUSED' | 'DELETED'>('OPEN');
    const [applicants, setApplicants] = useState<ApplicantDetail[]>([]);
    const [filterTab, setFilterTab] = useState<FilterTab>('All');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const loadApplicants = useCallback(async () => {
        if (!jobId) return;
        try {
            const res = await getJobApplicants(jobId);
            setApplicants(res.data ?? []);
        } catch {
            // non-fatal — show empty state
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        loadApplicants();
    }, [loadApplicants]);

    const filteredApplicants = (() => {
        if (filterTab === 'Shortlisted') {
            return applicants.filter(a => a.status === 'shortlisted');
        }
        if (filterTab === 'Recent') {
            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            return applicants.filter(a => new Date(a.appliedAt).getTime() > cutoff);
        }
        return applicants;
    })();

    if (jobStatus === 'DELETED') {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <StatusBar style="dark" />
                <MaterialCommunityIcons name="delete-empty" size={80} color={COLORS.textLight} />
                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.secondary, marginTop: 16 }}>
                    {t('jobDeleted') || 'Job Deleted'}
                </Text>
                <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
                    This job post has been permanently removed.
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 }}
                    onPress={() => router.replace('/hirer/workers-list')}
                >
                    <Text style={{ color: COLORS.white, fontWeight: '800' }}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const togglePause = async () => {
        if (!jobId) return;
        const newStatus = jobStatus === 'OPEN' ? 'PAUSED' : 'OPEN';
        setActionLoading(true);
        try {
            await updateHirerJob(jobId, { status: newStatus });
            setJobStatus(newStatus);
            Alert.alert(
                newStatus === 'PAUSED' ? (t('pauseJob') || 'Job Paused') : (t('resumeJob') || 'Job Resumed'),
                newStatus === 'PAUSED'
                    ? 'Your job is now hidden from workers.'
                    : 'Your job is now visible to workers again.'
            );
        } catch {
            Alert.alert('Error', 'Failed to update job status. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = () => {
        if (!jobId) return;
        Alert.alert(
            t('deleteJob') || 'Delete Job',
            'Are you sure you want to delete this job permanently?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await deleteHirerJob(jobId);
                            setJobStatus('DELETED');
                        } catch {
                            Alert.alert('Error', 'Failed to delete job. Please try again.');
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const updateApplicantStatus = async (applicationId: string, newStatus: string, applicantName: string) => {
        if (!jobId) return;
        try {
            await updateApplicationStatusByHirer(jobId, applicationId, newStatus);
            setApplicants(prev =>
                prev.map(a => a.applicationId === applicationId ? { ...a, status: newStatus } : a)
            );
            const label = newStatus === 'SHORTLISTED'
                ? (t('shortlisted') || 'Shortlisted')
                : (t('rejected') || 'Rejected');
            Alert.alert(label, `${applicantName} has been ${label.toLowerCase()}.`);
        } catch {
            Alert.alert('Error', 'Failed to update applicant status. Please try again.');
        }
    };

    const isPaused = jobStatus === 'PAUSED';

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: isPaused ? '#64748B' : COLORS.primary, paddingTop: insets.top + 20 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
                        <Ionicons name="arrow-back" size={28} color={COLORS.white} />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.white, flex: 1 }} numberOfLines={1}>
                            {jobTitle || 'Job'}
                        </Text>
                        <View style={[styles.statusPill, { backgroundColor: isPaused ? '#FCA5A5' : '#4ADE80' }]}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.white }}>
                                {isPaused ? 'PAUSED' : 'ACTIVE'}
                            </Text>
                        </View>
                    </View>
                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
                        {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                {/* Quick Actions Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('quickActions') || 'Quick Actions'}</Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.actionOrb, { backgroundColor: isPaused ? '#F0FDF4' : '#FFF7ED' }]}
                            onPress={togglePause}
                            disabled={actionLoading}
                        >
                            <View style={[styles.orbIcon, { backgroundColor: isPaused ? '#DCFCE7' : '#FFEDD5' }]}>
                                <MaterialCommunityIcons
                                    name={isPaused ? 'play' : 'pause'}
                                    size={24}
                                    color={isPaused ? '#16A34A' : '#EA580C'}
                                />
                            </View>
                            <Text style={styles.orbText}>{isPaused ? (t('resumeJob') || 'Resume Job') : (t('pauseJob') || 'Pause Job')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionOrb, { backgroundColor: '#F0F9FF' }]}
                            onPress={() => router.push({ pathname: '/hirer/job-posting', params: { jobId, businessType: '' } })}
                        >
                            <View style={[styles.orbIcon, { backgroundColor: '#E0F2FE' }]}>
                                <Clipboard size={22} color="#0284C7" />
                            </View>
                            <Text style={styles.orbText}>{t('editJob') || 'Edit Job'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionOrb, { backgroundColor: '#FEF2F2' }]}
                            onPress={handleDelete}
                            disabled={actionLoading}
                        >
                            <View style={[styles.orbIcon, { backgroundColor: '#FEE2E2' }]}>
                                <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.orbText}>{t('deleteJob') || 'Delete Job'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Applicants Section */}
                    <View style={{ marginTop: 32 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
                            {t('recentApplicants') || 'Applicants'}
                        </Text>

                        {/* Filter Tabs */}
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                            {(['All', 'Shortlisted', 'Recent'] as FilterTab[]).map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setFilterTab(tab)}
                                    style={[styles.filterTab, filterTab === tab && styles.filterTabActive]}
                                >
                                    <Text style={[styles.filterTabText, filterTab === tab && styles.filterTabTextActive]}>
                                        {tab === 'All' ? (t('all') || 'All') :
                                         tab === 'Shortlisted' ? (t('shortlisted') || 'Shortlisted') :
                                         (t('recent') || 'Recent')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {loading ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator color={COLORS.primary} />
                            </View>
                        ) : filteredApplicants.length > 0 ? (
                            filteredApplicants.map((app) => {
                                const isShortlisted = app.status === 'shortlisted';
                                const isRejected = app.status === 'rejected';
                                const isPending = !isShortlisted && !isRejected;
                                return (
                                    <View key={app.applicationId} style={styles.appCard}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: isPending ? 16 : 0 }}>
                                            <View style={[styles.avatar, { backgroundColor: isShortlisted ? '#ECFDF5' : '#F8F9FE' }]}>
                                                {isShortlisted ? (
                                                    <Check size={20} color="#059669" />
                                                ) : (
                                                    <Text style={{ color: COLORS.primary, fontWeight: '800' }}>
                                                        {(app.fullName || '?')[0].toUpperCase()}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.secondary }}>
                                                    {app.fullName || 'Applicant'}
                                                </Text>
                                                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                                                    {app.city}{app.city && app.state ? ', ' : ''}{app.state}
                                                    {app.expectedSalaryMin > 0 ? ` • ₹${app.expectedSalaryMin}–${app.expectedSalaryMax}` : ''}
                                                </Text>
                                            </View>
                                            <View style={[
                                                styles.statusTag,
                                                {
                                                    backgroundColor: isShortlisted ? '#ECFDF5' : isRejected ? '#FEF2F2' : '#F3F4F6'
                                                }
                                            ]}>
                                                <Text style={{
                                                    fontSize: 10,
                                                    fontWeight: '800',
                                                    color: isShortlisted ? '#059669' : isRejected ? '#EF4444' : '#6B7280'
                                                }}>
                                                    {app.status}
                                                </Text>
                                            </View>
                                        </View>

                                        {isPending && (
                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                <TouchableOpacity
                                                    style={[styles.appBtn, { backgroundColor: COLORS.primary, flex: 2 }]}
                                                    onPress={() => updateApplicantStatus(app.applicationId, 'shortlisted', app.fullName)}
                                                >
                                                    <Check size={16} color={COLORS.white} />
                                                    <Text style={styles.appBtnText}>{t('shortlist') || 'Shortlist'}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.appBtn, { backgroundColor: '#F3F4F6', flex: 1 }]}
                                                    onPress={() => updateApplicantStatus(app.applicationId, 'rejected', app.fullName)}
                                                >
                                                    <X size={16} color="#6B7280" />
                                                    <Text style={[styles.appBtnText, { color: '#6B7280' }]}>{t('reject') || 'Reject'}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        ) : (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <UserIcon size={40} color={COLORS.textLight} />
                                <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>
                                    {t('noApplicants') || 'No applicants yet'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {actionLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    content: { flex: 1 },
    header: {
        paddingBottom: 60,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    card: {
        backgroundColor: COLORS.white,
        marginTop: -30,
        marginHorizontal: 16,
        borderRadius: 32,
        padding: 24,
        ...SHADOWS.medium,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    actionOrb: { width: '31%', padding: 12, borderRadius: 20, alignItems: 'center', gap: 8 },
    orbIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    orbText: { fontSize: 11, fontWeight: '700', color: COLORS.secondary, textAlign: 'center' },
    filterTab: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    filterTabActive: { backgroundColor: COLORS.primary },
    filterTabText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
    filterTabTextActive: { color: COLORS.white },
    appCard: {
        backgroundColor: '#F8F9FE',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    appBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    appBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
