/**
 * @fileoverview Login Screen Component for University of Waikato Smart Parking System
 * 
 * This component provides the user login interface with form validation,
 * error handling, and secure password input. It integrates with the
 * authentication context for user sign-in operations.
 * 
 * Features:
 * - Email and password validation
 * - Password visibility toggle
 * - Loading states and error handling
 * - Responsive design for mobile devices
 * - Accessibility support
 * 
 * @version 1.0.0
 * @author University of Waikato Development Team
 * @since 2024-10-01
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';

/**
 * Login Screen Component
 * 
 * Provides user authentication interface with email/password form validation.
 * Includes password visibility toggle, loading states, and comprehensive error handling.
 * 
 * Navigation:
 * - Back button returns to welcome screen
 * - Successful login redirects to main app tabs
 * - Footer link navigates to registration screen
 * 
 * @component
 * @returns {JSX.Element} Login screen with form and navigation
 * 
 * @example
 * ```tsx
 * // Used in authentication stack navigation
 * <Stack.Screen name="login" component={LoginScreen} />
 * ```
 */
export default function LoginScreen() {
  // Form state management
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Authentication context
  const { signIn } = useAuth();

  /**
   * Handle user login form submission
   * 
   * Validates form inputs, calls authentication service, and handles
   * success/error scenarios with appropriate user feedback.
   * 
   * Validation:
   * - Ensures both email and password fields are filled
   * - Displays alert for missing fields
   * 
   * Success Flow:
   * - Redirects to main application tabs
   * 
   * Error Flow:
   * - Displays error message to user
   * - Resets loading state
   * 
   * @returns {Promise<void>} Resolves when login process completes
   */
  const handleLogin = async (): Promise<void> => {
    // Form validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    // Additional email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      console.log('LoginScreen: Attempting login for email:', email.trim());
      
      const { error } = await signIn(email.trim(), password);
      
      if (error) {
        console.error('LoginScreen: Login failed:', error.message);
        Alert.alert('Login Failed', error.message);
      } else {
        console.log('LoginScreen: Login successful, redirecting to main app');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('LoginScreen: Unexpected error during login:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.linkText}>Sign up</Text>
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  linkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
});