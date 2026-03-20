import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, SHADOWS } from '@/constants/theme';
import { Lock } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSave = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        // Mock password change success
        Alert.alert('Success', 'Password changed successfully');
        router.back();
    };

    return (
        <View style={styles.container}>
            <AppHeader title="Change Password" showBack />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.formCard}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Current Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                                secureTextEntry={!showCurrentPassword}
                            />
                            <Feather
                                name={showCurrentPassword ? "eye" : "eye-off"}
                                size={20}
                                color={COLORS.textSecondary}
                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            />
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                secureTextEntry={!showNewPassword}
                            />
                            <Feather
                                name={showNewPassword ? "eye" : "eye-off"}
                                size={20}
                                color={COLORS.textSecondary}
                                onPress={() => setShowNewPassword(!showNewPassword)}
                            />
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm New Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                secureTextEntry={!showConfirmPassword}
                            />
                            <Feather
                                name={showConfirmPassword ? "eye" : "eye-off"}
                                size={20}
                                color={COLORS.textSecondary}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            />
                        </View>
                    </View>
                </View>

                <Text style={styles.helperText}>
                    Password must be at least 6 characters long and include a mix of update functionality if connected to backend.
                </Text>
            </ScrollView>

            <View style={styles.footer}>
                <PrimaryButton title="Update Password" onPress={handleSave} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.small,
    },
    inputContainer: {
        marginVertical: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
        marginVertical: 16,
    },
    helperText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 20,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    footer: {
        padding: 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },
});
