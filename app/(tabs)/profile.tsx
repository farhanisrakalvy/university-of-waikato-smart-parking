import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase, Database } from '@/lib/supabase';
import { User, Mail, Phone, LogOut, ChevronDown } from 'lucide-react-native';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+7', country: 'RU', flag: '🇷🇺' },
  { code: '+27', country: 'ZA', flag: '🇿🇦' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { balance } = useWallet();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        
        if (data.phone_number) {
          const existingPhone = data.phone_number;
          const matchingCountry = COUNTRY_CODES.find(country =>
            existingPhone.startsWith(country.code)
          );
          
          if (matchingCountry) {
            setSelectedCountryCode(matchingCountry);
            setPhoneNumber(existingPhone.replace(matchingCountry.code, ''));
          } else {
            setPhoneNumber(existingPhone);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback(async () => {
    if (!user) return;

    if (!fullName.trim()) {
      Alert.alert('Invalid Name', 'Please enter your full name');
      return;
    }

    // Validate phone number if provided
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      Alert.alert(
        'Invalid Phone Number', 
        `Please enter a valid phone number for ${selectedCountryCode.country}. Expected length: ${selectedCountryCode.code === '+1' ? '10 digits' : '7-15 digits'}`
      );
      return;
    }

    const fullPhoneNumber = phoneNumber
      ? `${selectedCountryCode.code}${phoneNumber.replace(/^\+/, '').replace(/\D/g, '')}`
      : '';

    try {
      setSaving(true);
      console.log('Updating profile with:', {
        full_name: fullName.trim(),
        phone_number: fullPhoneNumber,
        user_id: user.id
      });

      const { error, data } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          phone_number: fullPhoneNumber,
        })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);

      setProfile(prev => prev ? {
        ...prev,
        full_name: fullName.trim(),
        phone_number: fullPhoneNumber,
      } : null);

      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error', 
        `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setSaving(false);
    }
  }, [user, fullName, phoneNumber, selectedCountryCode, fetchProfile]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting sign out process...');
              const result = await signOut();
              console.log('Sign out result:', result);
              
              // Force navigation to auth screen
              console.log('Navigating to auth screen...');
              router.replace('/(auth)');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountryCode(country);
    setShowCountryPicker(false);
  };

  const formatPhoneForDisplay = (phone?: string | null) => {
    if (!phone) return 'No phone number';
    return phone;
  };

  // Phone number validation function
  const validateAndFormatPhoneNumber = (input: string) => {
    // Remove all non-numeric characters
    const numericOnly = input.replace(/\D/g, '');
    
    // Limit to maximum 15 digits (international standard)
    const limitedNumber = numericOnly.slice(0, 15);
    
    // For US numbers, format as (XXX) XXX-XXXX
    if (selectedCountryCode.code === '+1' && limitedNumber.length >= 10) {
      const formatted = limitedNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      return formatted;
    }
    
    // For other countries, just return the numeric string with spaces for readability
    if (limitedNumber.length > 6) {
      return limitedNumber.replace(/(\d{3})/g, '$1 ').trim();
    }
    
    return limitedNumber;
  };

  // Validate phone number length based on country
  const isValidPhoneNumber = (phone: string) => {
    const numericOnly = phone.replace(/\D/g, '');
    
    // Most countries have phone numbers between 7-15 digits
    if (numericOnly.length < 7 || numericOnly.length > 15) {
      return false;
    }
    
    // Additional validation for specific countries
    switch (selectedCountryCode.code) {
      case '+1': // US/Canada
        return numericOnly.length === 10;
      case '+44': // UK
        return numericOnly.length >= 10 && numericOnly.length <= 11;
      case '+91': // India
        return numericOnly.length === 10;
      default:
        return numericOnly.length >= 7 && numericOnly.length <= 15;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          onPress={() => editing ? updateProfile() : setEditing(true)}
          style={[styles.editButton, saving && styles.disabledButton]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.editButtonText}>
              {editing ? 'Save' : 'Edit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <User size={60} color="#6B7280" />
          </View>
          <Text style={styles.welcomeText}>
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </Text>
          
          <View style={styles.walletContainer}>
            <View style={styles.balanceDisplay}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
              />
            ) : (
              <View style={styles.displayField}>
                <User size={20} color="#6B7280" />
                <Text style={styles.displayText}>{profile.full_name}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.displayField}>
              <Mail size={20} color="#6B7280" />
              <Text style={styles.displayText}>{profile.email}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            {editing ? (
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity 
                  style={styles.countryCodeButton}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Text style={styles.countryFlag}>{selectedCountryCode.flag}</Text>
                  <Text style={styles.countryCodeText}>{selectedCountryCode.code}</Text>
                  <ChevronDown size={16} color="#6B7280" />
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    const formatted = validateAndFormatPhoneNumber(text);
                    setPhoneNumber(formatted);
                  }}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  maxLength={20}
                />
              </View>
            ) : (
              <View style={styles.displayField}>
                <Phone size={20} color="#6B7280" />
                <Text style={styles.displayText}>
                  {formatPhoneForDisplay(profile.phone_number)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Member Since</Text>
            <View style={styles.displayField}>
              <Text style={styles.displayText}>
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {editing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setEditing(false);
              setFullName(profile?.full_name || '');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Developer Information */}
        <View style={styles.developerSection}>
          <Text style={styles.developerTitle}>Developed by</Text>
          <Text style={styles.developerName}>Farhan Alvy</Text>
          <Text style={styles.developerAnd}>&</Text>
          <Text style={styles.developerName}>Nazib Shajib</Text>
          <Text style={styles.universityText}>University of Waikato</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryPickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryPicker(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <View style={styles.countryItemInfo}>
                    <Text style={styles.countryItemName}>{item.country}</Text>
                    <Text style={styles.countryItemCode}>{item.code}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  walletContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
    marginTop: 4,
  },
  balanceDisplay: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  form: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  displayField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  displayText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  countryFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  signOutButtonText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  countryPickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryItemFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryItemInfo: {
    flex: 1,
  },
  countryItemName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  countryItemCode: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  // Developer Information Styles
  developerSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  developerTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '500',
  },
  developerName: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  developerAnd: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  universityText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '400',
  },
});