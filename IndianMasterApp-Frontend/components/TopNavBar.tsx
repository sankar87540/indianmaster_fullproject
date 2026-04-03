import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Linking } from 'react-native';
import { Phone, Bell, Menu } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';

type Props = {
  unreadCount: number;
  onMenuPress: () => void;
};

export default function TopNavBar({ unreadCount, onMenuPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topRow, { paddingTop: insets.top + 8 }]}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.icons}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Linking.openURL('tel:+919876543210')}
        >
          <Phone size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push('/notifications')}
        >
          <Bell size={22} color={COLORS.primary} />
          {unreadCount > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
          <Menu size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 0,
    paddingRight: 24,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
  },
  logo: {
    width: 185,
    height: 62,
    marginLeft: -30,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
});
