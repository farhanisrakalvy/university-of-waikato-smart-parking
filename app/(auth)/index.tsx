import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Car } from 'lucide-react-native';

export default function WelcomeScreen() {
  const { session, loading } = useAuth();
  const { height: screenHeight } = Dimensions.get('window');
  
  useEffect(() => {
    if (session && !loading) {
      router.replace('/(tabs)');
    }
  }, [session, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Top Section with Logo and Features */}
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Car size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>UoW Smart Park</Text>
            <Text style={styles.subtitle}>Easy Parking, Anytime, Anywhere on Campus</Text>
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <MapPin size={24} color="#2563EB" />
              <Text style={styles.featureText}>Real-time availability</Text>
            </View>
            <View style={styles.feature}>
              <Car size={24} color="#2563EB" />
              <Text style={styles.featureText}>Easy booking system</Text>
            </View>
          </View>
        </View>

        {/* Bottom Section with Action Buttons */}
        <View style={styles.bottomSection}>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.secondaryButtonText}>I have an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 20,
  },
  bottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBackground: {
    width: 96,
    height: 96,
    backgroundColor: '#2563EB',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  features: {
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  actions: {
    gap: 16,
    paddingHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});