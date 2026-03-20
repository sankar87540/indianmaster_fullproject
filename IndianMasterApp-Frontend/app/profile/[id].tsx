import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MapPin, Star, Phone, MessageCircle, Briefcase } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '@/constants/theme';

export default function PublicProfileScreen() {
    const { id, name, image, role } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${name}'s profile on Indian Master!`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header / Banner */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <MaterialCommunityIcons name="share-variant" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            <View style={styles.banner} />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.profileInfo}>
                    <Image
                        source={{ uri: (image as string) || 'https://images.unsplash.com/photo-1540569014015-19a7ee504e3a?q=80&w=200' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{name || 'User Profile'}</Text>
                    <Text style={styles.role}>{role || 'Worker'}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Star size={16} color="#F59E0B" fill="#F59E0B" />
                            <Text style={styles.statValue}>4.8</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Briefcase size={16} color={COLORS.primary} />
                            <Text style={styles.statValue}>5+ Years</Text>
                            <Text style={styles.statLabel}>Exp</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.success} />
                            <Text style={styles.statValue}>Verified</Text>
                            <Text style={styles.statLabel}>Status</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.aboutText}>
                        Professional with extensive experience in the food and hospitality industry.
                        Dedicated to providing high-quality service and maintaining excellence in a fast-paced environment.
                    </Text>

                    <Text style={styles.sectionTitle}>Details</Text>
                    <View style={styles.detailItem}>
                        <MapPin size={18} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>Chennai, Tamil Nadu</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Briefcase size={18} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>Full Time / Contract</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
                <TouchableOpacity
                    style={[styles.footerButton, styles.chatButton]}
                    onPress={() => router.back()}
                >
                    <MessageCircle size={20} color={COLORS.white} />
                    <Text style={styles.footerButtonText}>Back to Chat</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    banner: {
        height: 180,
        backgroundColor: COLORS.primary,
    },
    content: {
        flex: 1,
        marginTop: -60,
    },
    profileInfo: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: COLORS.white,
        backgroundColor: '#F1F5F9',
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        marginTop: 15,
    },
    role: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 15,
        marginTop: 25,
        width: '100%',
        ...SHADOWS.medium,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#F1F5F9',
        alignSelf: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    detailsSection: {
        padding: 20,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 20,
        marginBottom: 10,
    },
    aboutText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailText: {
        fontSize: 15,
        color: COLORS.text,
        marginLeft: 12,
    },
    footer: {
        padding: 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    footerButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    chatButton: {
        backgroundColor: COLORS.primary,
    },
    footerButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
