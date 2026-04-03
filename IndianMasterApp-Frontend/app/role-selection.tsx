import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/theme';
import { sendOTP, verifyOTP } from '@/services/authService';
import { getWorkerProfile, getHirerProfile } from '@/services/workerService';

export default function RoleSelectionScreen() {
  const { t } = useTranslation();
  const { role } = useLocalSearchParams();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetOtp = async () => {
    console.log('SEND OTP pressed');
    console.log('phone value', phone);
    if (phone.length !== 10) return;
    setLoading(true);
    setError('');
    try {
      const result = await sendOTP('+91' + phone);
      setRequestId(result.requestId);
      setShowOtp(true);
    } catch (e: any) {
      console.log('sendOTP error', e);
      setError(e?.message ?? 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const backendRole = role === 'hirer' ? 'HIRER' : 'WORKER';
      await verifyOTP('+91' + phone, otp, requestId, backendRole, 'en');
      if (role === 'hirer') {
        // Check whether this hirer already has a business profile.
        // verifyOTP has already saved the JWT, so this call is authenticated.
        try {
          const hirerProfile = await getHirerProfile();
          if (hirerProfile) {
            // Profile exists → skip setup, go straight to the dashboard
            router.replace('/hirer/workers-list');
          } else {
            // No profile yet (404 returned as null) → first-time setup
            router.push('/hirer/restaurant-setup');
          }
        } catch (profileErr: any) {
          // 401/403/500/network — surface the real error, do NOT silently redirect to setup
          throw profileErr;
        }
      } else {
        // Check whether this worker already has a profile in the database.
        // verifyOTP has already saved the JWT, so this call is authenticated.
        try {
          await getWorkerProfile();
          // Profile exists → skip setup, go straight to the jobs feed
          router.replace('/worker/jobs-feed');
        } catch (profileErr: any) {
          console.log('getWorkerProfile error after OTP verify:', profileErr?.statusCode, profileErr?.message);
          if (profileErr?.statusCode === 404) {
            // No profile yet → first-time setup
            router.push('/worker/education-type');
          } else {
            // 401/403/500/network — surface the real error, do NOT redirect to setup
            throw profileErr;
          }
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isHirer = role === 'hirer';

  return (
    <View style={styles.container}>
      <AppHeader showBack />

      <View style={styles.content}>
        <Text style={styles.title}>
          {isHirer ? t('hireStaff') : t('findWork')}
        </Text>
        <Text style={styles.subtitle}>
          {isHirer
            ? t('hireStaffSubtitle')
            : t('findWorkSubtitle')
          }
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>{t('mobileNumber')}</Text>
          <View style={styles.phoneContainer}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder={t('enterMobile')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {showOtp && (
            <>
              <Text style={styles.label}>{t('verifyOtp')}</Text>
              <TextInput
                style={styles.otpInput}
                placeholder={t('enterOtp')}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
              />
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <ActivityIndicator style={styles.button} color={COLORS.primary} />
          ) : (
            <PrimaryButton
              title={showOtp ? t('verifyOtp') : t('getOtp')}
              onPress={showOtp ? handleVerifyOtp : handleGetOtp}
              disabled={showOtp ? otp.length !== 6 : phone.length !== 10}
              style={styles.button}
            />
          )}
        </View>

        <Text style={styles.terms}>
          {t('terms')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  form: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 20,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    marginTop: 20,
  },
  error: {
    color: COLORS.error ?? '#E53935',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  terms: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});