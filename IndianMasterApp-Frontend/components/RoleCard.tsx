import { TouchableOpacity, Text, StyleSheet, View, ViewStyle, Image } from 'react-native';
import { LucideIcon, ChevronRight } from 'lucide-react-native';
import { COLORS, SIZES, SPACING, SHADOWS } from '@/constants/theme';

interface RoleCardProps {
    title: string;
    subtitle?: string;
    Icon?: LucideIcon;
    imageSource?: any;
    onPress: () => void;
    style?: ViewStyle;
}

export default function RoleCard({
    title,
    subtitle,
    Icon,
    imageSource,
    onPress,
    style
}: RoleCardProps) {
    return (
        <TouchableOpacity
            style={[styles.card, style]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.iconWrapper}>
                {imageSource ? (
                    <Image
                        source={imageSource}
                        style={styles.imageIcon}
                        resizeMode="cover"
                    />
                ) : Icon ? (
                    <Icon size={48} color={COLORS.primary} strokeWidth={2.5} />
                ) : null}
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        backgroundColor: COLORS.white,
        borderRadius: 24,
        width: 250,
        height: 300,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    iconWrapper: {
        width: '100%',
        height: '75%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    content: {
        height: '25%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 4,
    },
    imageIcon: {
        width: '100%',
        height: '135%', // Forces image to be tall enough to maintain aspect ratio without center cropping
        position: 'absolute',
        top: 0,
    },
});
