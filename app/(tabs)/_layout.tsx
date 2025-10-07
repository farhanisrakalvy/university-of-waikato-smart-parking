import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Map, Calendar, User, Wallet } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { session, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  
  // More comprehensive responsive sizing
  const isSmallScreen = width < 375;
  const isVerySmallScreen = width < 320;
  const isShortScreen = height < 700;
  
  // Calculate optimal sizes
  const iconSize = isVerySmallScreen ? 18 : isSmallScreen ? 20 : 22;
  const fontSize = isVerySmallScreen ? 9 : isSmallScreen ? 10 : 11;
  const tabBarHeight = Platform.OS === 'ios' 
    ? (isShortScreen ? 75 : 80) + (insets.bottom || 0)
    : isShortScreen ? 60 : 65;

  useEffect(() => {
    if (!loading && !session) {
      // User is not authenticated, redirect to auth
      router.replace('/(auth)');
    }
  }, [session, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    // Render nothing while redirecting
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: isShortScreen ? 4 : 6,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 6,
          paddingHorizontal: isSmallScreen ? 4 : 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -1,
          },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 3,
        },
        tabBarLabelStyle: {
          fontSize: fontSize,
          fontWeight: '500',
          marginBottom: 2,
          marginTop: 2,
          includeFontPadding: false,
        },
        tabBarItemStyle: {
          paddingVertical: isShortScreen ? 2 : 4,
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused, color }) => (
            <Map 
              size={iconSize} 
              color={color} 
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: isVerySmallScreen ? 'Book' : 'Bookings',
          tabBarIcon: ({ focused, color }) => (
            <Calendar 
              size={iconSize} 
              color={color} 
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="topup"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused, color }) => (
            <Wallet 
              size={iconSize} 
              color={color} 
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <User 
              size={iconSize} 
              color={color} 
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
    </Tabs>
  );
}
