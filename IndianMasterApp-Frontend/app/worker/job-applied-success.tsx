import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS } from '@/constants/theme';
import FadeInView from '@/components/FadeInView';

export default function JobAppliedSuccessScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const handleReturn = () => {
        router.replace('/worker/jobs-feed');
    };

    return (
        <View style={styles.container}>
            <FadeInView style={[styles.content, isDesktop && styles.desktopContent]}>
                <View style={styles.iconContainer}>
                    <CheckCircle size={100} color={COLORS.success} />
                </View>

                <Text style={styles.title}>
                    Job Applied Successfully!
                </Text>

                <Text style={styles.description}>
                    Your profile details have been securely sent to the employer. They will review your application and contact you soon.
                </Text>

                <PrimaryButton
                    title="Back to Jobs"
                    onPress={handleReturn}
                    style={styles.button}
                />
            </FadeInView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: 40,
    },
    desktopContent: {
        maxWidth: 500,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#DCFCE7', // Light green background
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 16,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
    }
});
