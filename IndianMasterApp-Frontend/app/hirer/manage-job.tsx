import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Clipboard, User as UserIcon, X, ChevronRight, Plus, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

export default function manageJobScreen() {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    // --- FUNCTIONAL STATE ---
    const [jobStatus, setJobStatus] = useState<'Active' | 'Paused' | 'Deleted'>('Active');
    const [applicants, setApplicants] = useState([
        { id: 1, name: 'Sanjay Kumar', role: 'Head Chef', status: 'Pending', time: '2h ago' },
        { id: 2, name: 'Rahul Dev', role: 'Sous Chef', status: 'Pending', time: '5h ago' },
        { id: 3, name: 'Priya Mani', role: 'Catering Manager', status: 'Shortlisted', time: '1d ago' },
    ]);

    const [filterTab, setFilterTab] = useState('All');

    const filteredApplicants = filterTab === 'All'
        ? applicants
        : applicants.filter(app => app.status === 'Shortlisted');

    if (jobStatus === 'Deleted') {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <StatusBar style="dark" />
                <MaterialCommunityIcons name="delete-empty" size={80} color={COLORS.textLight} />
                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.secondary, marginTop: 16 }}>{t('jobDeleted') || 'Job Deleted'}</Text>
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

    const togglePause = () => {
        const newStatus = jobStatus === 'Active' ? 'Paused' : 'Active';
        setJobStatus(newStatus);
        Alert.alert(
            newStatus === 'Paused' ? t('pauseJob') : t('resumeJob'),
            newStatus === 'Paused' ? 'Your job is now hidden from workers.' : 'Your job is now visible to workers again.'
        );
    };

    const handleDelete = () => {
        Alert.alert(
            t('deleteJob'),
            'Are you sure you want to delete this job permanently?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => setJobStatus('Deleted') }
            ]
        );
    };

    const updateApplicantStatus = (id: number, newStatus: string) => {
        setApplicants(prev => prev.map(app =>
            app.id === id ? { ...app, status: newStatus } : app
        ));
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <ScrollView style={[styles.content, { backgroundColor: '#F8F9FE' }]} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header Section */}
                <View style={{
                    backgroundColor: jobStatus === 'Paused' ? '#64748B' : COLORS.primary,
                    paddingTop: insets.top + 20,
                    paddingBottom: 60,
                    paddingHorizontal: 24,
                    borderBottomLeftRadius: 40,
                    borderBottomRightRadius: 40,
                }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
                        <Ionicons name="arrow-back" size={28} color={COLORS.white} />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Text style={{ fontSize: 32, fontWeight: '800', color: COLORS.white }}>Head Chef</Text>
                                <View style={{
                                    backgroundColor: jobStatus === 'Active' ? '#4ADE80' : '#FCA5A5',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 12
                                }}>
                                    <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.white }}>
                                        {jobStatus.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
                                Spice Garden • Anna Nagar, Chennai
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Status Card */}
                <View style={{
                    backgroundColor: COLORS.white,
                    marginTop: -30,
                    marginHorizontal: 16,
                    borderRadius: 32,
                    padding: 24,
                    ...SHADOWS.medium,
                }}>
                    <Text style={styles.sectionTitle}>{t('quickActions') || 'Quick Actions'}</Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        {/* Pause/Resume Work Button */}
                        <TouchableOpacity
                            style={[styles.actionOrb, { backgroundColor: jobStatus === 'Active' ? '#FFF7ED' : '#F0FDF4' }]}
                            onPress={togglePause}
                        >
                            <View style={[styles.orbIcon, { backgroundColor: jobStatus === 'Active' ? '#FFEDD5' : '#DCFCE7' }]}>
                                <MaterialCommunityIcons
                                    name={jobStatus === 'Active' ? "pause" : "play"}
                                    size={24}
                                    color={jobStatus === 'Active' ? "#EA580C" : "#16A34A"}
                                />
                            </View>
                            <Text style={styles.orbText}>{jobStatus === 'Active' ? t('pauseJob') : t('resumeJob')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionOrb, { backgroundColor: '#F0F9FF' }]}
                            onPress={() => router.push('/hirer/job-posting')}
                        >
                            <View style={[styles.orbIcon, { backgroundColor: '#E0F2FE' }]}>
                                <Clipboard size={22} color="#0284C7" />
                            </View>
                            <Text style={styles.orbText}>{t('editJob')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionOrb, { backgroundColor: '#FEF2F2' }]}
                            onPress={handleDelete}
                        >
                            <View style={[styles.orbIcon, { backgroundColor: '#FEE2E2' }]}>
                                <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.orbText}>{t('deleteJob')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Applicant Section */}
                    <View style={{ marginTop: 32 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t('recentApplicants') || 'Recent Applicants'}</Text>
                        </View>

                        {/* Filter Tabs */}
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                            {['All', 'Shortlisted'].map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setFilterTab(tab)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 12,
                                        backgroundColor: filterTab === tab ? COLORS.primary : '#F1F5F9',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 13,
                                        fontWeight: '700',
                                        color: filterTab === tab ? COLORS.white : COLORS.textSecondary
                                    }}>
                                        {tab === 'All' ? t('all') || 'All' : t('shortlisted') || 'Shortlisted'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {filteredApplicants.length > 0 ? (
                            filteredApplicants.map((app) => (
                                <View key={app.id} style={styles.appCard}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: app.status === 'Pending' ? 16 : 0 }}>
                                        <View style={[styles.avatar, { backgroundColor: app.status === 'Shortlisted' ? '#ECFDF5' : COLORS.white }]}>
                                            {app.status === 'Shortlisted' ? (
                                                <Check size={20} color="#059669" />
                                            ) : (
                                                <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{app.name[0]}</Text>
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.secondary }}>{app.name}</Text>
                                            <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>{app.role} • {app.time}</Text>
                                        </View>
                                        <View style={[styles.statusTag, { backgroundColor: app.status === 'Shortlisted' ? '#ECFDF5' : app.status === 'Rejected' ? '#FEF2F2' : '#F3F4F6' }]}>
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: app.status === 'Shortlisted' ? '#059669' : app.status === 'Rejected' ? '#EF4444' : '#6B7280' }}>
                                                {app.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    {app.status === 'Pending' && (
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <TouchableOpacity
                                                style={[styles.appBtn, { backgroundColor: COLORS.primary, flex: 2 }]}
                                                onPress={() => {
                                                    updateApplicantStatus(app.id, 'Shortlisted');
                                                    Alert.alert(t('shortlisted'), `Candidate ${app.name} has been added to your shortlist.`);
                                                }}
                                            >
                                                <Check size={16} color={COLORS.white} />
                                                <Text style={styles.appBtnText}>{t('shortlist')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.appBtn, { backgroundColor: '#F3F4F6', flex: 1 }]}
                                                onPress={() => {
                                                    updateApplicantStatus(app.id, 'Rejected');
                                                    Alert.alert(t('rejected'), `Candidate ${app.name} has been moved to rejection.`);
                                                }}
                                            >
                                                <X size={16} color="#6B7280" />
                                                <Text style={[styles.appBtnText, { color: '#6B7280' }]}>{t('reject')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))
                        ) : (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <UserIcon size={40} color={COLORS.textLight} />
                                <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>{t('noApplicants')}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    content: { flex: 1 },
    sectionTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    actionOrb: { width: '31%', padding: 12, borderRadius: 20, alignItems: 'center', gap: 8 },
    orbIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    orbText: { fontSize: 11, fontWeight: '700', color: COLORS.secondary, textAlign: 'center' },
    appCard: { backgroundColor: '#F8F9FE', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    appBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
    appBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});

