import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, useWindowDimensions, Linking, Alert } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock, Phone, Check, CreditCard } from 'lucide-react-native';
import PrimaryButton from '@/components/PrimaryButton';
import { workers } from '@/data/workers';
import { COLORS } from '@/constants/theme';
import FadeInView from '@/components/FadeInView';

export default function SubscriptionScreen() {
  const { workerId } = useLocalSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { width } = useWindowDimensions();

  const worker = workerId ? workers.find(w => w.id === workerId) : null;

  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;

  const plans = {
    monthly: {
      price: '₹299',
      period: '/month',
      features: [
        'Contact 50 workers',
        'Priority support',
        'Verified profiles only',
        'Save favorite workers',
        'Chat with workers',
      ],
    },
    yearly: {
      price: '₹2,999',
      period: '/year',
      savings: 'Save ₹588',
      features: [
        'Contact unlimited workers',
        '24/7 Priority support',
        'Verified profiles only',
        'Save unlimited favorites',
        'Chat with workers',
        'Advanced filters',
        'Analytics dashboard',
      ],
    },
  };

  const currentPlan = plans[selectedPlan];

  const handleSubscribe = () => {
    setTimeout(() => {
      setIsSubscribed(true);
    }, 1000);
  };

  const handleCallNow = async () => {
    if (!worker) return;
    const phoneNumber = worker.fullPhone || '+91 98765 43210';
    // Remove spaces and format for tel: URL
    const formattedNumber = phoneNumber.replace(/\s/g, '');
    const url = `tel:${formattedNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone dialer is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open phone dialer');
    }
  };

  const handleWhatsApp = async () => {
    if (!worker) return;
    const phoneNumber = worker.fullPhone || '+91 98765 43210';
    // Remove spaces and + for WhatsApp format
    const formattedNumber = phoneNumber.replace(/[\s+]/g, '');
    // WhatsApp URL format: https://wa.me/<country_code><phone_number>
    const url = `https://wa.me/${formattedNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.placeholder} />
      </View>


      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isSmallScreen && styles.scrollContentSmall
        ]}
      >
        {!isSubscribed ? (
          <>
            <FadeInView delay={100}>
              {/* Lock Icon */}
              <View style={styles.lockContainer}>
                <View style={[
                  styles.lockCircle,
                  isSmallScreen && styles.lockCircleSmall
                ]}>
                  <Lock
                    size={isSmallScreen ? 36 : 48}
                    color={COLORS.premium}
                    strokeWidth={2.5}
                  />
                </View>
              </View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={[
                  styles.title,
                  isSmallScreen && styles.titleSmall
                ]}>
                  {worker ? 'Contact Privacy Protection' : 'Premium Subscription'}
                </Text>
                <Text style={[
                  styles.subtitle,
                  isSmallScreen && styles.subtitleSmall
                ]}>
                  {worker ? 'Contact details are protected for\nworker privacy' : 'Unlock full access to all premium features\nand unlimited contacts'}
                </Text>
              </View>

              {/* Protected Contact Card (Only if worker exists) */}
              {worker && (
                <View style={[
                  styles.contactCard,
                  isSmallScreen && styles.contactCardSmall
                ]}>
                  <Text style={[
                    styles.contactLabel,
                    isSmallScreen && styles.contactLabelSmall
                  ]}>
                    Contact: {worker.name}
                  </Text>
                  <View style={styles.phoneContainer}>
                    <Phone size={isSmallScreen ? 18 : 20} color="#6B7280" />
                    <Text style={[
                      styles.phoneNumber,
                      isSmallScreen && styles.phoneNumberSmall
                    ]}>
                      {worker.maskedPhone || '+91 ******7862'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.unlockText,
                    isSmallScreen && styles.unlockTextSmall
                  ]}>
                    Subscribe to unlock full contact details
                  </Text>
                </View>
              )}
            </FadeInView>

            <FadeInView delay={300} style={styles.planSection}>
              {/* Plan Selection */}
              <View>
                <Text style={[
                  styles.sectionTitle,
                  isSmallScreen && styles.sectionTitleSmall
                ]}>
                  Choose Your Plan
                </Text>

                <View style={styles.planToggle}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      selectedPlan === 'monthly' && styles.toggleButtonActive
                    ]}
                    onPress={() => setSelectedPlan('monthly')}
                  >
                    <Text style={[
                      styles.toggleText,
                      selectedPlan === 'monthly' && styles.toggleTextActive,
                      isSmallScreen && styles.toggleTextSmall
                    ]}>
                      Monthly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      selectedPlan === 'yearly' && styles.toggleButtonActive
                    ]}
                    onPress={() => setSelectedPlan('yearly')}
                  >
                    <Text style={[
                      styles.toggleText,
                      selectedPlan === 'yearly' && styles.toggleTextActive,
                      isSmallScreen && styles.toggleTextSmall
                    ]}>
                      Yearly
                    </Text>
                    {selectedPlan === 'yearly' && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>Save ₹588</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Plan Card */}
                <View style={[
                  styles.planCard,
                  isSmallScreen && styles.planCardSmall
                ]}>
                  <View style={styles.planHeader}>
                    <Text style={[
                      styles.planName,
                      isSmallScreen && styles.planNameSmall
                    ]}>
                      {selectedPlan === 'monthly' ? 'Monthly Plan' : 'Yearly Plan'}
                    </Text>
                    <View style={styles.priceContainer}>
                      <Text style={[
                        styles.price,
                        isSmallScreen && styles.priceSmall
                      ]}>
                        {currentPlan.price}
                      </Text>
                      <Text style={[
                        styles.period,
                        isSmallScreen && styles.periodSmall
                      ]}>
                        {currentPlan.period}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featuresContainer}>
                    {currentPlan.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <View style={[
                          styles.checkCircle,
                          isSmallScreen && styles.checkCircleSmall
                        ]}>
                          <Check
                            size={isSmallScreen ? 14 : 16}
                            color="#10B981"
                            strokeWidth={3}
                          />
                        </View>
                        <Text style={[
                          styles.featureText,
                          isSmallScreen && styles.featureTextSmall
                        ]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Subscribe Button */}
              <View style={styles.buttonContainer}>
                <PrimaryButton
                  title={`Subscribe ${currentPlan.price}${currentPlan.period}`}
                  onPress={handleSubscribe}
                  style={styles.subscribeButton}
                />
                <Text style={[
                  styles.termsText,
                  isSmallScreen && styles.termsTextSmall
                ]}>
                  By subscribing, you agree to our Terms & Conditions
                </Text>
              </View>

            </FadeInView>

            <FadeInView delay={500} style={[
              styles.trustSection,
              isSmallScreen && styles.trustSectionSmall
            ]}>
              <View style={styles.trustItem}>
                <View style={[
                  styles.trustIconContainer,
                  isSmallScreen && styles.trustIconContainerSmall
                ]}>
                  <Lock size={isSmallScreen ? 20 : 24} color={COLORS.premium} />
                </View>
                <Text style={[
                  styles.trustText,
                  isSmallScreen && styles.trustTextSmall
                ]}>
                  Secure{'\n'}Payment
                </Text>
              </View>
              <View style={styles.trustItem}>
                <View style={[
                  styles.trustIconContainer,
                  isSmallScreen && styles.trustIconContainerSmall
                ]}>
                  <Check
                    size={isSmallScreen ? 20 : 24}
                    color="#10B981"
                    strokeWidth={3}
                  />
                </View>
                <Text style={[
                  styles.trustText,
                  isSmallScreen && styles.trustTextSmall
                ]}>
                  Cancel{'\n'}Anytime
                </Text>
              </View>
              <View style={styles.trustItem}>
                <View style={[
                  styles.trustIconContainer,
                  isSmallScreen && styles.trustIconContainerSmall
                ]}>
                  <CreditCard size={isSmallScreen ? 20 : 24} color={COLORS.primary} />
                </View>
                <Text style={[
                  styles.trustText,
                  isSmallScreen && styles.trustTextSmall
                ]}>
                  Money-back{'\n'}Guarantee
                </Text>
              </View>
            </FadeInView>
          </>
        ) : (
          <>
            {/* Success State */}
            <View style={styles.successContainer}>
              <View style={[
                styles.successCircle,
                isSmallScreen && styles.successCircleSmall
              ]}>
                <Check
                  size={isSmallScreen ? 48 : 56}
                  color="#10B981"
                  strokeWidth={3}
                />
              </View>
              <Text style={[
                styles.title, // Use title for the success title to match style size
                isSmallScreen && styles.titleSmall
              ]}>
                Subscription Active!
              </Text>
              <Text style={[
                styles.subtitle, // Same for subtitle
                isSmallScreen && styles.subtitleSmall,
                { marginBottom: 20 }
              ]}>
                You can now contact workers and access{'\n'}all premium features
              </Text>

              {/* Add a button to go back to workers list / home */}
              {!worker && (
                <PrimaryButton
                  title="Explore Workers"
                  onPress={() => router.replace('/hirer/workers-list')}
                  style={{ minWidth: 200, marginTop: 16 }}
                />
              )}
            </View>

            {/* Unlocked Contact (Only if worker exists) */}
            {worker && (
              <View style={[
                styles.unlockedCard, // Will rely on existing styles
                isSmallScreen && styles.contactCardSmall // fallback
              ]}>
                <Text style={[
                  styles.contactLabel,
                  isSmallScreen && styles.contactLabelSmall
                ]}>
                  Contact: {worker.name}
                </Text>
                <View style={styles.phoneContainer}>
                  <Phone size={isSmallScreen ? 18 : 20} color="#10B981" />
                  <Text style={[
                    styles.phoneNumber,
                    styles.phoneUnlocked,
                    isSmallScreen && styles.phoneNumberSmall
                  ]}>
                    {worker.fullPhone || '+91 98765 43210'}
                  </Text>
                </View>

                <View style={[
                  styles.contactActions, // Will rely on existing styles
                  isSmallScreen && styles.contactActionsSmall // fallback
                ]}>
                  <PrimaryButton
                    title="📞 Call Now"
                    onPress={handleCallNow}
                    style={{ marginBottom: 12 }} // Inline fallback
                  />
                  <PrimaryButton
                    title="💬 WhatsApp"
                    onPress={handleWhatsApp}
                    variant="outline"
                  />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  logo: {
    height: 32,
    width: 120,
  },
  logoSmall: {
    height: 28,
    width: 100,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  scrollContentSmall: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  lockContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  lockCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.premium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lockCircleSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 22,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitleSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactCardSmall: {
    padding: 16,
    marginBottom: 24,
    borderRadius: 12,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  contactLabelSmall: {
    fontSize: 15,
    marginBottom: 10,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  phoneNumber: {
    fontSize: 16,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  phoneNumberSmall: {
    fontSize: 14,
  },
  phoneUnlocked: {
    color: '#10B981',
    fontWeight: '600',
  },
  unlockText: {
    fontSize: 14,
    color: COLORS.premium,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  unlockTextSmall: {
    fontSize: 13,
  },
  planSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitleSmall: {
    fontSize: 18,
    marginBottom: 14,
  },
  planToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextSmall: {
    fontSize: 14,
  },
  toggleTextActive: {
    color: COLORS.text,
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.premium,
    shadowColor: COLORS.premium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  planCardSmall: {
    padding: 16,
    borderRadius: 12,
  },
  planHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  planNameSmall: {
    fontSize: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.premium,
  },
  priceSmall: {
    fontSize: 28,
  },
  period: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  periodSmall: {
    fontSize: 14,
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
  },
  featureTextSmall: {
    fontSize: 14,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  subscribeButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  termsTextSmall: {
    fontSize: 11,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trustSectionSmall: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trustIconContainerSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
  },
  trustText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  trustTextSmall: {
    fontSize: 10,
    lineHeight: 13,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  successCircleSmall: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 12,
  },
  successTitleSmall: {
    fontSize: 22,
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  successSubtitleSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  unlockedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  unlockedCardSmall: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  contactActionsSmall: {
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
  },
});