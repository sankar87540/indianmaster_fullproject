import { View, Image, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { router, usePathname, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell, Phone, Globe, Check, X } from 'lucide-react-native';
import { Linking, Modal, FlatList, Dimensions } from 'react-native';
import { COLORS, SHADOWS } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { useState, useCallback } from 'react';
import { getUnreadCount } from '@/services/notificationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
  showNotification?: boolean;
  showCallSupport?: boolean;
  showLanguage?: boolean;
}

export default function AppHeader({
  showBack = false,
  showNotification = false,
  showCallSupport = false,
  showLanguage = false,
  title
}: AppHeaderProps) {
  const { i18n, t } = useTranslation();
  const pathname = usePathname();
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refresh unread count every time the screen that owns this header comes into focus
  useFocusEffect(useCallback(() => {
    if (!showNotification) return;
    getUnreadCount().then(setUnreadCount).catch(() => {});
  }, [showNotification]));

  const languages = [
    { code: 'en', label: 'En', native: 'English' },
    { code: 'ta', label: 'Ta', native: 'தமிழ்' },
    { code: 'hi', label: 'Hi', native: 'हिन्दी' },
  ];

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    setIsLangModalVisible(false);
  };
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {showBack && (
          <View style={styles.backButtonContainer}>
            <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); }}>
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        )}

        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <Image
            source={require('@/assets/images/icon.png')}
            style={[styles.logo, showBack && { marginLeft: -1 }]}
            resizeMode="contain"
          />
        )}

        <View style={styles.rightActions}>
          {showLanguage && (
            <TouchableOpacity
              style={styles.langButton}
              onPress={() => setIsLangModalVisible(true)}
            >
              <Globe size={18} color={COLORS.primary} />
              <Text style={styles.langText}>
                {languages.find(l => l.code === i18n.language)?.code.toUpperCase() || 'EN'}
              </Text>
            </TouchableOpacity>
          )}

          {showNotification && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                router.push('/notifications');
              }}
            >
              <Bell size={22} color={COLORS.text} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99' : String(unreadCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {showCallSupport && (
            <TouchableOpacity style={styles.callSupportButton} onPress={() => Linking.openURL('tel:+919876543210')}>
              <Phone size={14} color={COLORS.white} />
              <Text style={styles.callSupportText}>{t('supportBtn')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Language Selection Modal */}
        <Modal
          visible={isLangModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsLangModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsLangModalVisible(false)}
          >
            <View style={styles.langModalContent}>
              <View style={styles.langModalHeader}>
                <Text style={styles.langModalTitle}>{t('changeLanguage')}</Text>
                <TouchableOpacity onPress={() => setIsLangModalVisible(false)}>
                  <X size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              {languages.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.langOption,
                    i18n.language === item.code && styles.langOptionActive
                  ]}
                  onPress={() => changeLanguage(item.code)}
                >
                  <View>
                    <Text style={[
                      styles.langOptionLabel,
                      i18n.language === item.code && styles.langOptionLabelActive
                    ]}>{item.native}</Text>
                  </View>
                  {i18n.language === item.code && (
                    <Check size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 45, // Safe Area padding top
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    justifyContent: 'center',
    height: 120, // Increased height for larger logo
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingLeft: 0,
    paddingRight: 15,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: 220,
    height: 75,
    marginLeft: 6,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    paddingHorizontal: 60, // Avoid overlap with left/right buttons
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  iconButton: {
    padding: 6,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 5,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 11,
  },
  callSupportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 5,
    ...SHADOWS.small,
  },
  callSupportText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langModalContent: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.large,
  },
  langModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  langModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 6,
  },
  langOptionActive: {
    backgroundColor: COLORS.primary + '08',
  },
  langOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  langOptionLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});