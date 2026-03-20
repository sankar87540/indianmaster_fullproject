import { View, Text, StyleSheet, Image, useWindowDimensions, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Store, UtensilsCrossed } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import RoleCard from '@/components/RoleCard';
import { COLORS, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { getAuthSession } from '@/utils/storage';

// ─────────────────────────────────────────────
//  Screen stages
//  0 = Splash / Branding
//  1 = Language Selection
//  2 = Welcome / Role Selection
// ─────────────────────────────────────────────

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { t, i18n } = useTranslation();

  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  // Fade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  // Pulsing glow effect
  const glowOpacity = useRef(new Animated.Value(0.4)).current;

  // Zoom animation for Logo
  const logoScale = useRef(new Animated.Value(1)).current;
  // Lighting shimmer effect
  const logoShine = useRef(new Animated.Value(0)).current;

  const languages = [
    { code: 'ta', label: 'Tamil', native: 'தமிழ்', symbol: 'அ', color: '#0EA5E9' },
    { code: 'en', label: 'English', native: 'English', symbol: 'A', color: '#10B981' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी', symbol: 'अ', color: '#F59E0B' },
  ];

  const [isReady, setIsReady] = useState(false);

  // ── Check existing session → redirect without showing splash ──
  // useFocusEffect (not useEffect) so this re-runs every time the screen
  // gains focus — including after logout brings the user back to this screen.
  useFocusEffect(
    useCallback(() => {
      async function checkSession() {
        try {
          const session = await getAuthSession();
          if (session?.loggedIn) {
            if (session.role === 'hirer') {
              router.replace('/hirer/workers-list');
            } else {
              router.replace('/worker/jobs-feed');
            }
            return;
          }
        } catch (_) {
          // No session
        }
        setIsReady(true);
      }
      checkSession();
    }, [])
  );

  // Auto-transition: Splash → Language Selection after 3.5 s
  useEffect(() => {
    if (!isReady) return;

    // Zoom In and Out ONLY ONCE
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 2.5,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // ... (rest of animations) ...
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoShine, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoShine, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(1000),
      ])
    ).start();

    const timer = setTimeout(() => {
      fadeToStage(1);
    }, 3500);
    return () => clearTimeout(timer);
  }, [isReady]);

  if (!isReady) {
    // Show a blank view that matches the splash background to avoid flicker
    return <View style={{ flex: 1, backgroundColor: COLORS.white }} />;
  }

  const fadeToStage = (nextStage: 0 | 1 | 2) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setStage(nextStage);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLang(langCode);
    i18n.changeLanguage(langCode);
    setTimeout(() => fadeToStage(2), 200);
  };

  // ── STAGE 0: Splash / Branding ──────────────────────────────
  if (stage === 0) {
    return (
      <Animated.View style={[styles.brandingContainer, { opacity: fadeAnim }]}>
        <StatusBar style="dark" />

        <View style={styles.mainContent}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.brandingLogoWrapper,
              {
                transform: [{ scale: logoScale }],
                shadowColor: '#0EA5E9',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 20,
                elevation: 15, // Provides the shadow on Android
              }
            ]}
          >
            <View style={{ overflow: 'hidden', position: 'relative' }}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={[styles.splashLogo, { width: width * 0.75, maxWidth: 350 }]}
                resizeMode="contain"
              />
              {/* Sweeping Light Effect */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: 40,
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  transform: [
                    { skewX: '-30deg' },
                    {
                      translateX: logoShine.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-150, 400]
                      })
                    }
                  ]
                }}
              />
            </View>
          </Animated.View>

          {/* Tagline */}
          <View style={styles.taglineSection}>
            <Text style={styles.taglineText}>
              <Text style={styles.taglineHighlight}>Digital hiring platform </Text>
              for hotel &amp; food business.
            </Text>
            <View style={styles.taglineUnderline} />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.supportSection}>
          <View style={styles.supportHeader}>
            <View style={styles.headerLineLeft} />
            <View style={styles.headerTitleWrapper}>
              <View style={[styles.starIconSmall, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.supportTitle}>{t('supportTitle') || 'Happy to Support'}</Text>
              <View style={[styles.starIconSmall, { backgroundColor: '#10B981' }]} />
            </View>
            <View style={styles.headerLineRight} />
          </View>

          <View style={styles.supportLogos}>
            <View style={styles.supportLogoItem}>
              <Image
                source={require('@/assets/images/Ministry_of_Labour_and_Employment.png')}
                style={styles.supportLogoImgGov}
                resizeMode="contain"
              />
            </View>
            <View style={styles.supportLogoItemSquare}>
              <Image
                source={require('@/assets/images/download.png')}
                style={styles.supportLogoImgAicte}
                resizeMode="contain"
              />
            </View>
            <View style={styles.supportLogoItem}>
              <Image
                source={require('@/assets/images/images.png')}
                style={styles.supportLogoImgStartup}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ── STAGE 1: Language Selection ─────────────────────────────
  if (stage === 1) {
    return (
      <Animated.View style={[styles.langContainer, { opacity: fadeAnim }]}>
        <StatusBar style="dark" />

        {/* Top Logo */}
        <View style={styles.langLogoWrapper}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={[styles.langLogo, { width: width * 0.70, maxWidth: 280 }]}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={styles.langTitleWrapper}>
          <Text style={styles.langWelcome}>
            {t('welcomeTo')}{' '}
            <Text style={styles.langBrand}>{t('indianMaster')}</Text>
          </Text>
          <Text style={styles.langSubtitle}>{t('selectLanguage')}</Text>

        </View>

        {/* Language Cards - Centered & Fixed */}
        <View style={styles.langCardsFixedContainer}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langSquareCard,
                selectedLang === lang.code && styles.langCardSelected,
                { borderColor: selectedLang === lang.code ? lang.color : '#E5E7EB' },
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.8}
            >
              {/* Symbol */}
              <View style={[styles.langSymbolCircle, { backgroundColor: lang.color + '1A' }]}>
                <Text style={[styles.langSymbolText, { color: lang.color }]}>{lang.symbol}</Text>
              </View>

              {/* Labels */}
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.langNativeLabel, { color: '#1E293B' }]}>{lang.native}</Text>
                <Text style={styles.langEnglishLabel}>{lang.label}</Text>
              </View>

              {/* Selected Checkmark Indicator - Top Right */}
              {selectedLang === lang.code && (
                <View style={[styles.selectedCheckBadge, { backgroundColor: lang.color }]}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom hint */}
        <Text style={styles.langHint}>
          You can change this later in Settings
        </Text>
      </Animated.View>
    );
  }

  // ── STAGE 2: Welcome / Role Selection ───────────────────────
  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#FFFFFF', opacity: fadeAnim }}>
      <StatusBar style="dark" />
      <View style={styles.langContainer}>
        {/* Top Logo */}
        <View style={styles.langLogoWrapper}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={[styles.langLogo, { width: width * 0.70, maxWidth: 280 }]}
            resizeMode="contain"
          />
        </View>

        {/* Content */}
        <View style={[styles.textContainer, { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }]}>
          {/* Roles Selection */}
          <View style={[styles.cardsContainer, isDesktop && styles.desktopCardsContainer]}>
            <RoleCard
              imageSource={require('@/assets/images/3d-cartoon-portrait-person-practicing-law-related-profession.jpg')}
              title={t('employer')}
              onPress={() => router.push('/role-selection?role=hirer')}
              style={styles.cardSpacing}
            />
            <RoleCard
              imageSource={require('@/assets/images/3d-cartoon-portrait-person-practicing-law-profession (2).jpg')}
              title={t('worker')}
              onPress={() => router.push('/role-selection?role=worker')}
              style={styles.cardSpacing}
            />
          </View>

          <View style={[styles.tipContainer, { marginBottom: 10 }]}>
            <Text style={styles.tipText}>
              <Text style={styles.tipLabel}>{t('tip')}</Text> - {t('switchRolesTip')}
            </Text>
          </View>

          {/* Change Language Link */}
          <TouchableOpacity onPress={() => fadeToStage(1)} style={[styles.changeLangBtn, { marginBottom: 10 }]}>
            <Text style={styles.changeLangText}>🌐 {t('changeLanguage')}</Text>
          </TouchableOpacity>

          <Text style={styles.trustText}>{t('trustedBy')}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── Splash / Branding ──────────────────────
  brandingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  brandingLogoWrapper: {
    marginBottom: SPACING.xxl,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  splashLogo: {
    height: 140,
    backgroundColor: 'transparent',
  },
  taglineSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  taglineText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 34,
  },
  taglineHighlight: {
    color: '#10B981',
  },
  taglineUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginTop: 12,
    opacity: 0.3,
  },
  supportSection: {
    position: 'absolute',
    bottom: SPACING.xl + 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    width: '100%',
  },
  headerLineLeft: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  headerLineRight: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
    marginLeft: 10,
  },
  headerTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starIconSmall: {
    width: 8,
    height: 8,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  supportLogos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
    width: '100%',
  },
  supportLogoItem: {
    width: 100,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportLogoItemSquare: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportLogoImgGov: {
    width: '100%',
    height: '100%',
  },
  supportLogoImgAicte: {
    width: '100%',
    height: '100%',
  },
  supportLogoImgStartup: {
    width: '100%',
    height: '100%',
  },

  // ── Language Selection ──────────────────────
  langContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    paddingBottom: 20,
  },
  langLogoWrapper: {
    marginTop: 0,
    marginBottom: 5,
    alignItems: 'center',
  },
  langLogo: {
    height: 110,
  },
  langTitleWrapper: {
    alignItems: 'center',
    marginBottom: 15,
  },
  langWelcome: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  langBrand: {
    color: '#10B981',
    fontWeight: '900',
  },
  langSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 2,
  },
  langSubtitleHi: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 10,
  },
  langSubtitleTa: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 2,
  },
  langCardsFixedContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  langSquareCard: {
    backgroundColor: '#FFFFFF',
    width: 135,
    height: 135,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    // Premium Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    padding: 10,
    position: 'relative',
  },
  langCardSelected: {
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  langSymbolCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  langSymbolText: {
    fontSize: 28,
    fontWeight: '800',
  },
  langNativeLabel: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 1,
  },
  langEnglishLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  checkIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  langHint: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
  },

  // ── Role Selection (Stage 2) ────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  desktopContainer: {
    paddingTop: 80,
    maxWidth: 800,
    alignSelf: 'center',
  },
  logoContainer: {
    marginTop: 10,
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
  },
  logoImage: {
    height: 110,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    maxWidth: 600,
  },
  desktopTextContainer: {
    maxWidth: 800,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 36,
  },
  desktopHeadline: {
    fontSize: 42,
    lineHeight: 52,
    marginBottom: SPACING.md,
  },
  subtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 24,
    maxWidth: 400,
  },
  desktopSubtext: {
    fontSize: 18,
    maxWidth: 600,
    marginBottom: SPACING.xxl * 1.5,
  },
  cardsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
    width: '100%',
    marginBottom: 20,
  },
  desktopCardsContainer: {
    maxWidth: 600,
  },
  cardSpacing: {
    // Width is now handled by the RoleCard component internally
  },
  changeLangBtn: {
    marginBottom: SPACING.lg,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  changeLangText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  tipContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  tipLabel: {
    color: '#FF6B00',
    fontWeight: '800',
  },
  trustText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
