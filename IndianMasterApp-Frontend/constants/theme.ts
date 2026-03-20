import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
    // Primary Brand Color - Blue
    primary: '#2563EB', // Bright Blue
    primaryDark: '#1E40AF', // Darker Blue for hover/pressed states
    primaryLight: '#DBEAFE', // Light Blue for backgrounds/highlights

    // Secondary Brand Color - Dark Blue/Slate
    secondary: '#1E293B', // Dark Slate Blue
    secondaryDark: '#0F172A', // Darker Slate for hover/pressed
    secondaryLight: '#F1F5F9', // Light Slate for backgrounds

    // Backgrounds
    background: '#F8FAFC', // Very Light Blue/Gray background
    white: '#FFFFFF',

    // Text Colors
    text: '#0F172A', // Primary text uses dark slate
    textPrimary: '#0F172A', // Explicit primary text
    textSecondary: '#475569', // Secondary text (Slate 600)
    textLight: '#94A3B8', // Light/disabled text
    textMuted: '#CBD5E1', // Very light text

    // Borders
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // States
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',

    // Active/Selected States (Blue)
    active: '#2563EB',
    selected: '#2563EB',
    focus: '#2563EB',

    // Accent/Highlight (Blue)
    accent: '#3B82F6',
    highlight: '#60A5FA',
    badge: '#EF4444', // Red for badges usually stands out better, or keep blue
    premium: '#F59E0B', // Gold for premium

    // UI Elements
    cardBackground: '#FFFFFF',
    shadow: '#64748B', // Slate shadow
    overlay: 'rgba(15, 23, 42, 0.5)',

    // Navigation
    navActive: '#2563EB',
    navInactive: '#64748B',
    navBackground: '#FFFFFF',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const SIZES = {
    width,
    height,
    h1: 28,
    h2: 24,
    h3: 20,
    h4: 18,
    body1: 16,
    body2: 14,
    body3: 12,
    radius: 20, // More rounded as per screenshot
    padding: 24,
    base: 8,
};

export const FONTS = {
    h1: { fontSize: SIZES.h1, lineHeight: 36, fontWeight: '700' },
    h2: { fontSize: SIZES.h2, lineHeight: 32, fontWeight: '700' },
    h3: { fontSize: SIZES.h3, lineHeight: 28, fontWeight: '600' },
    body1: { fontSize: SIZES.body1, lineHeight: 24 },
    body2: { fontSize: SIZES.body2, lineHeight: 20 },
    body3: { fontSize: SIZES.body3, lineHeight: 16 },
};

export const SHADOWS = {
    small: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    medium: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    large: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
};
