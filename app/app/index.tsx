import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, loading } = useAuth();

  console.log('Index route - Session:', session, 'Loading:', loading); // Debug log

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If the user is not authenticated, redirect to the auth screen
  if (!session) {
    console.log('Redirecting to auth - No session'); // Debug log
    return <Redirect href="/auth" />;
  }

  // If the user is authenticated, redirect to the main app
  console.log('Redirecting to tabs - Session exists'); // Debug log
  return <Redirect href="/(tabs)" />;
} 