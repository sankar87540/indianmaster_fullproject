import './i18n';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { registerForPushNotifications } from '@/services/notificationService';
import { setUnauthorizedHandler } from '@/services/apiClient';

// NOTE: SplashScreen.preventAutoHideAsync() is intentionally NOT called here.
// expo-router/entry (the app "main" entrypoint) already calls it before any
// route code runs. A duplicate call hits the already-active keep-awake lock
// and throws "Unable to activate keep awake" — removing the duplicate fixes it.

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Centralized 401 handler — registered once for the app lifetime.
    // When any apiFetch call receives a 401, the token is cleared and this
    // callback fires so the user is sent back to the welcome/login screen
    // regardless of which screen triggered the expired-token request.
    // Only the first concurrent 401 should trigger navigation.
    // Multiple in-flight requests can all fail with 401 simultaneously;
    // without this guard each one calls router.replace('/') and queues
    // redundant navigation actions.
    let redirecting = false;
    setUnauthorizedHandler(() => {
      if (redirecting) return;
      redirecting = true;
      router.replace('/');
    });

    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
      }
      // Register for push notifications after splash clears.
      // Silently no-ops if user is not yet logged in; re-runs are safe.
      registerForPushNotifications();
    }

    prepare();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="role-selection" />
        <Stack.Screen name="hirer" />
        <Stack.Screen name="worker" />
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}