import { Stack } from 'expo-router';

export default function HirerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="restaurant-setup" />
      <Stack.Screen name="job-posting" />
      <Stack.Screen name="workers-list" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="manage-job" />
    </Stack>
  );
}