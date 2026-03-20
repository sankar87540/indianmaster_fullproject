import { Stack } from 'expo-router';

export default function WorkerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="education-type" />
      <Stack.Screen name="educated-setup" />
      <Stack.Screen name="uneducated-setup" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="jobs-feed" />
      <Stack.Screen name="job-applied-success" />
    </Stack>
  );
}