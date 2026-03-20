import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface NotificationData {
    id: string;
    headerText: string;
    title: string;
    subtitle: string;
    expandedContent: string;
    isImportant: boolean;
    defaultExpanded?: boolean;
}



const IndianMasterIcon = () => (
    <View style={styles.lokalIconContainer}>
        <MaterialCommunityIcons name="chef-hat" size={20} color="#2563EB" style={{ marginBottom: -2 }} />
        <Text style={styles.logoTextMain}>INDIAN</Text>
        <Text style={styles.logoTextSub}>MASTER</Text>
        <View style={styles.logoBottomBar} />
    </View>
);

const NotificationItem = ({ item }: { item: NotificationData }) => {
    const [expanded, setExpanded] = useState(item.defaultExpanded ? true : false);

    return (
        <TouchableOpacity
            style={[styles.card, expanded ? styles.cardExpanded : undefined]}
            activeOpacity={0.8}
            onPress={() => setExpanded(!expanded)}
        >
            <View style={styles.cardHeaderRow}>
                <IndianMasterIcon />

                <View style={styles.textContainer}>
                    {expanded && item.headerText ? (
                        <Text style={styles.headerText}>{item.headerText}</Text>
                    ) : null}

                    <Text style={[styles.titleText, expanded ? { marginTop: 2 } : undefined]} numberOfLines={expanded ? undefined : 1}>
                        {item.title}
                    </Text>

                    {(!expanded || !item.expandedContent) && item.subtitle ? (
                        <Text style={styles.subtitleText} numberOfLines={expanded ? undefined : 1}>
                            {item.subtitle}
                        </Text>
                    ) : null}

                    {expanded && item.expandedContent ? (
                        <Text style={styles.expandedContentText}>
                            {item.expandedContent}
                        </Text>
                    ) : null}
                </View>

                <View style={styles.rightActionContainer}>
                    {expanded ? (
                        <Feather name="chevron-up" size={20} color="#888888" style={{ marginLeft: 8 }} />
                    ) : (
                        <Feather name="chevron-down" size={20} color="#888888" style={{ marginLeft: 8 }} />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function NotificationsScreen() {
    const { t } = useTranslation();
    const { role } = useLocalSearchParams();
    const isEmployer = role === 'employer';

    const WORKER_NOTIFICATIONS: NotificationData[] = [
        {
            id: '1',
            headerText: `${t('indianMaster')} 💼 15:30`,
            title: t('notifications.worker.t1'),
            subtitle: t('notifications.worker.s1'),
            expandedContent: t('notifications.worker.d1'),
            isImportant: false,
        },
        {
            id: '2',
            headerText: `${t('indianMaster')} 💼 14:20`,
            title: t('notifications.worker.t2'),
            subtitle: t('notifications.worker.s2'),
            expandedContent: t('notifications.worker.d2'),
            isImportant: true,
        },
        {
            id: '3',
            headerText: `${t('indianMaster')} 💼 13:04`,
            title: t('notifications.worker.t3'),
            subtitle: t('notifications.worker.s3'),
            expandedContent: t('notifications.worker.d3'),
            isImportant: false,
            defaultExpanded: true,
        },
        {
            id: '4',
            headerText: `${t('indianMaster')} 💼 11:55`,
            title: t('notifications.worker.t4'),
            subtitle: t('notifications.worker.s4'),
            expandedContent: t('notifications.worker.d4'),
            isImportant: false,
        },
        {
            id: '5',
            headerText: `${t('indianMaster')} 💼 10:15`,
            title: t('notifications.worker.t5'),
            subtitle: t('notifications.worker.s5'),
            expandedContent: t('notifications.worker.d5'),
            isImportant: false,
        },
    ];

    const EMPLOYER_NOTIFICATIONS: NotificationData[] = [
        {
            id: 'e1',
            headerText: `${t('indianMaster')} 👨‍🍳 16:00`,
            title: t('notifications.employer.t1'),
            subtitle: t('notifications.employer.s1'),
            expandedContent: t('notifications.employer.d1'),
            isImportant: false,
            defaultExpanded: true,
        },
        {
            id: 'e2',
            headerText: `${t('indianMaster')} 🔔 09:30`,
            title: t('notifications.employer.t2'),
            subtitle: t('notifications.employer.s2'),
            expandedContent: t('notifications.employer.d2'),
            isImportant: false,
        },
        {
            id: 'e3',
            headerText: `${t('indianMaster')} 🚨 08:00`,
            title: t('notifications.employer.t3'),
            subtitle: t('notifications.employer.s3'),
            expandedContent: t('notifications.employer.d3'),
            isImportant: true,
        },
    ];

    const notifications = isEmployer ? EMPLOYER_NOTIFICATIONS : WORKER_NOTIFICATIONS;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color="#000000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <NotificationItem item={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50, // Safe area padding
        paddingBottom: 15,
        backgroundColor: '#FFFFFF', // White Header
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#3B82F6', // Blue active indicator
    },
    tabText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#3B82F6', // Blue active text
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#3B82F6', // Primary Blue card
        borderRadius: 32, // Pill shaped like screenshot when collapsed
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2563EB',
    },
    cardExpanded: {
        borderRadius: 24, // Less pill-like, more rectangular when expanded
        paddingBottom: 20,
        backgroundColor: '#2563EB', // Deeper blue when expanded
        elevation: 4, // More shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    lokalIconContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    logoTextMain: {
        fontSize: 10,
        fontWeight: '900',
        color: '#2563EB',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        lineHeight: 12,
    },
    logoTextSub: {
        fontSize: 9,
        fontWeight: '800',
        color: '#F97316',
        textTransform: 'uppercase',
        letterSpacing: 2,
        lineHeight: 11,
    },
    logoBottomBar: {
        width: 15,
        height: 2,
        backgroundColor: '#2563EB',
        borderRadius: 1,
        marginTop: 1,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 2,
        marginRight: 8,
    },
    headerText: {
        color: '#DBEAFE', // Very light blue for secondary text
        fontSize: 12,
        marginBottom: 4,
    },
    titleText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFFFFF', // White for high contrast
        marginBottom: 4,
        lineHeight: 22,
    },
    subtitleText: {
        fontSize: 14,
        color: '#F0F9FF', // Almost white blue
        lineHeight: 20,
    },
    expandedContentText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFFFFF', // White for high contrast
        marginTop: 4,
        lineHeight: 24,
    },
    rightActionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 4,
    },
});
