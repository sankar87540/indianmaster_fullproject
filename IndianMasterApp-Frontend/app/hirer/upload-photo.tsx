import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, useWindowDimensions, Alert, AlertButton, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadHirerLogo } from '@/services/workerService';
import { Camera, ArrowLeft, X, Check } from 'lucide-react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import FadeInView from '@/components/FadeInView';
import ProgressIndicator from '@/components/ProgressIndicator';
import AppHeader from '@/components/AppHeader';

export default function UploadPhotoScreen() {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { businessType } = useLocalSearchParams<{ businessType: string }>();
    const [restaurantImage, setRestaurantImage] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    // --- PERSISTENCE ---
    useEffect(() => {
        const loadSavedPhoto = async () => {
            try {
                const savedPhoto = await AsyncStorage.getItem('restaurantPhoto');
                if (savedPhoto) setRestaurantImage({ uri: savedPhoto });
            } catch (error) {
                console.error('Error loading saved photo:', error);
            }
        };
        loadSavedPhoto();
    }, []);

    useEffect(() => {
        const savePhotoData = async () => {
            try {
                if (restaurantImage?.uri) {
                    await AsyncStorage.setItem('restaurantPhoto', restaurantImage.uri);
                } else {
                    await AsyncStorage.removeItem('restaurantPhoto');
                }
            } catch (error) {
                console.error('Error saving photo data:', error);
            }
        };
        savePhotoData();
    }, [restaurantImage]);

    const pickImage = async () => {
        if (Platform.OS === 'web') {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });
            if (!result.canceled) {
                setRestaurantImage({ uri: result.assets[0].uri });
            }
            return;
        }

        const options: AlertButton[] = [
            {
                text: 'Camera',
                onPress: async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
                        return;
                    }
                    try {
                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 0.5,
                        });
                        if (!result.canceled) {
                            setRestaurantImage({ uri: result.assets[0].uri });
                        }
                    } catch (e) {
                        console.error(e);
                    }
                },
            },
            {
                text: 'Gallery',
                onPress: async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission Denied', 'Sorry, we need gallery permissions to make this work!');
                        return;
                    }
                    try {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 0.5,
                        });
                        if (!result.canceled) {
                            setRestaurantImage({ uri: result.assets[0].uri });
                        }
                    } catch (e) {
                        console.error(e);
                    }
                },
            }
        ];

        if (restaurantImage) {
            options.push({
                text: 'Remove Photo',
                style: 'destructive',
                onPress: () => setRestaurantImage(null),
            });
        }

        options.push({ text: 'Cancel', style: 'cancel' });

        Alert.alert('Upload Photo', 'Choose a source', options);
    };

    const handleSkip = () => {
        router.push({
            pathname: '/hirer/job-posting',
            params: {
                businessType: businessType || '',
                hasPhoto: 'false'
            },
        });
    };

    const handleContinue = async () => {
        if (!restaurantImage) {
            Alert.alert(
                t('photoRequired') || 'Photo Required',
                t('pleaseUploadPhoto') || 'Please upload a restaurant photo to continue, or click Skip to proceed without one.',
                [{ text: 'OK' }]
            );
            return;
        }

        setUploading(true);
        try {
            await uploadHirerLogo(restaurantImage.uri);
        } catch (e: any) {
            // Non-fatal: log but still proceed
            console.warn('[UploadPhoto] logo upload failed:', e?.message);
        } finally {
            setUploading(false);
        }

        router.push({
            pathname: '/hirer/job-posting',
            params: {
                businessType: businessType || '',
                hasPhoto: 'true'
            },
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar style="dark" />

            <AppHeader showBack showCallSupport />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.vibrantHeader}>
                    <ProgressIndicator
                        currentStep={2}
                        totalSteps={3}
                        percentage={33 + (restaurantImage ? 33 : 0)}
                        stepTitle={t('uploadPhoto') || "Upload Photo"}
                    />
                    <View style={styles.headerHero}>
                        <View style={styles.heroTextBox}>
                            <Text style={styles.vibrantTitle}>{t('addRestaurantPhoto')}</Text>
                            <Text style={styles.vibrantSubtitle}>
                                {t('photoSubtitle')}
                            </Text>
                        </View>
                        <View style={styles.heroIconBox}>
                            <Camera size={60} color="rgba(255,255,255,0.2)" />
                        </View>
                    </View>
                </View>

                <FadeInView style={[styles.floatingWorkspace, isDesktop && styles.desktopContent]}>

                    {/* Image Upload Area */}
                    <FadeInView delay={200} style={styles.uploadCard}>
                        <TouchableOpacity
                            style={[
                                styles.uploadContainer,
                                restaurantImage && styles.uploadContainerActive
                            ]}
                            activeOpacity={0.7}
                            onPress={pickImage}
                        >
                            {restaurantImage ? (
                                <View style={styles.imageWrapper}>
                                    <Image
                                        source={restaurantImage}
                                        style={styles.previewImage}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={styles.removeBadge}
                                        onPress={() => setRestaurantImage(null)}
                                    >
                                        <X size={16} color={COLORS.white} />
                                    </TouchableOpacity>
                                    <View style={styles.checkBadge}>
                                        <Check size={20} color={COLORS.white} />
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <View style={styles.iconCircle}>
                                        <Feather name="upload" size={32} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.uploadText}>{t('photoSubtext')}</Text>
                                    <Text style={styles.uploadSubtext}>JPG, PNG up to 5MB</Text>

                                    <View style={styles.tipsContainer}>
                                        <View style={styles.tipItem}>
                                            <Feather name="check-circle" size={14} color={COLORS.success} />
                                            <Text style={styles.tipText}>{t('photoTip1')}</Text>
                                        </View>
                                        <View style={styles.tipItem}>
                                            <Feather name="check-circle" size={14} color={COLORS.success} />
                                            <Text style={styles.tipText}>{t('photoTip2')}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>

                        {restaurantImage && (
                            <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
                                <Feather name="refresh-cw" size={16} color={COLORS.primary} />
                                <Text style={styles.changeBtnText}>{t('changePhoto')}</Text>
                            </TouchableOpacity>
                        )}
                    </FadeInView>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.infoText}>
                            {t('photoInfo')}
                        </Text>
                    </View>

                    <View style={{ height: 120 }} />
                </FadeInView>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, isDesktop && styles.desktopFooter]}>
                <PrimaryButton
                    title={uploading ? 'Uploading…' : (restaurantImage ? t('saveAndContinue') : t('continue'))}
                    onPress={handleContinue}
                    disabled={!restaurantImage || uploading}
                    style={[
                        styles.continueButton,
                        restaurantImage && styles.saveButtonActive
                    ]}
                    textStyle={restaurantImage ? styles.saveButtonText : undefined}
                />
                <TouchableOpacity
                    onPress={handleSkip}
                    style={styles.skipButton}
                    activeOpacity={0.7}
                >
                    <Text style={styles.skipText}>{t('skip')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    vibrantHeader: {
        backgroundColor: COLORS.primary,
        paddingTop: Platform.OS === 'ios' ? 10 : 16,
        paddingHorizontal: 24,
        paddingBottom: 80,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
    },
    headerHero: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
    },
    heroTextBox: {
        flex: 1,
    },
    vibrantTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5,
        lineHeight: 34,
    },
    vibrantSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 6,
        lineHeight: 20,
        fontWeight: '500',
    },
    heroIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingWorkspace: {
        marginTop: -40,
        paddingHorizontal: 20,
    },
    desktopContent: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
    },
    uploadCard: {
        backgroundColor: COLORS.white,
        borderRadius: 40,
        padding: SPACING.md,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    uploadContainer: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
        overflow: 'hidden',
    },
    uploadContainerActive: {
        borderStyle: 'solid',
        borderColor: COLORS.primary,
        padding: 4,
        borderWidth: 3,
    },
    uploadPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    uploadText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.secondary,
        marginBottom: 4,
    },
    uploadSubtext: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: SPACING.lg,
    },
    tipsContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tipText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    removeBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    checkBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: COLORS.white,
        ...SHADOWS.medium,
    },
    changeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        marginTop: 8,
    },
    changeBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: COLORS.primaryLight,
        padding: 16,
        borderRadius: 20,
        marginTop: SPACING.xl,
        gap: 12,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.primaryDark,
        lineHeight: 20,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        padding: SPACING.lg,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        ...SHADOWS.large,
    },
    desktopFooter: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
        borderTopWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
    },
    continueButton: {
        width: '100%',
        height: 58,
    },
    saveButtonActive: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    skipButton: {
        width: '100%',
        paddingVertical: SPACING.md,
        marginTop: SPACING.xs,
        alignItems: 'center',
    },
    skipText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
});
