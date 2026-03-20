import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

export default function JobSuccess() {
    const { t } = useTranslation();
    const scaleValue = new Animated.Value(0);

    useEffect(() => {
        Animated.spring(scaleValue, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
        }).start();

        // Navigate to available workers list after 2.5 seconds
        const timer = setTimeout(() => {
            router.replace('/hirer/workers-list');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleValue }] }]}>
                <MaterialCommunityIcons name="check-decagram" size={140} color={COLORS.primary || '#e63946'} />
            </Animated.View>
            <Text style={styles.title}>{t('congratulations')}</Text>
            <Text style={styles.subtitle}>{t('jobPostedSuccess')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        marginBottom: 32,
        shadowColor: COLORS.primary || '#e63946',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text || '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: COLORS.textSecondary || '#666',
        textAlign: 'center',
        lineHeight: 26,
    },
});
