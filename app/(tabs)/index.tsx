import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { supabase, Database } from '@/lib/supabase';
// Import MapComponent with platform check
let MapComponent: any;
if (Platform.OS === 'web') {
  MapComponent = require('@/components/MapComponent.web').MapComponent;
} else {
  MapComponent = require('@/components/MapComponent').MapComponent;
}

// Platform-specific types for maps
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import {
  Navigation,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  CreditCard,
  X as CloseIcon,
  List,
  Map as MapIcon,
  Wallet,
  RefreshCw,
} from 'lucide-react-native';

type ParkingSpot = Database['public']['Tables']['parking_spots']['Row'];

export default function MapScreen() {
  // Get screen dimensions for responsive design
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  const isVerySmallScreen = screenWidth < 320;
  const isShortScreen = screenHeight < 700;
  
  // Create responsive styles
  const styles = createStyles(screenWidth, screenHeight);

  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: -37.78747,
    longitude: 175.32428,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  // NEW: Payment modal states - Initialize with future dates for proper booking
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const getNextHour = () => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    nextHour.setMilliseconds(0);
    return nextHour;
  };
  const [startDate, setStartDate] = useState(() => getNextHour());
  const [endDate, setEndDate] = useState(() => {
    const start = getNextHour();
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    return end;
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [useWalletPayment, setUseWalletPayment] = useState(false);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [selectedSavedCard, setSelectedSavedCard] = useState<any>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const { user } = useAuth();
  const { balance: walletBalance, deductFunds } = useWallet();

  // Load saved cards
  const loadSavedCards = async () => {
    try {
      const savedCardsData = await SecureStore.getItemAsync(`saved_cards_${user?.id}`);
      if (savedCardsData) {
        const cards = JSON.parse(savedCardsData);
        setSavedCards(cards || []);
      } else {
        setSavedCards([]);
      }
    } catch (error) {
      console.error('Error loading saved cards:', error);
      setSavedCards([]);
    }
  };

  // Load saved payment details when modal opens
  useEffect(() => {
    if (paymentModalVisible && user) {
      loadSavedCards();
      loadSavedPaymentDetails();
    }
  }, [paymentModalVisible, user]);

  // Load saved payment details
  const loadSavedPaymentDetails = async () => {
    try {
      const savedCardsData = await SecureStore.getItemAsync(`saved_cards_${user?.id}`);
      if (savedCardsData) {
        const savedCards = JSON.parse(savedCardsData);
        if (savedCards && savedCards.length > 0) {
          // Load the most recently saved card
          const mostRecentCard = savedCards[0];
          setCardNumber(mostRecentCard.number || `**** **** **** ${mostRecentCard.last4}`);
          setExpiryDate(mostRecentCard.expiryDate || mostRecentCard.expiry);
          setCardholderName(mostRecentCard.cardHolderName || mostRecentCard.name);
          // Don't load CVV for security reasons
        }
      }
    } catch (error) {
      console.error('Error loading saved card:', error);
    }
  };

  // Save payment details
  const savePaymentDetails = async () => {
    try {
      const newCard = {
        id: Date.now().toString(), // Simple ID generation
        number: cardNumber,
        last4: cardNumber.slice(-4),
        brand: 'visa', // You could determine this from card number
        expiryDate: expiryDate,
        cardHolderName: cardholderName,
        // Legacy fields for compatibility
        expiry: expiryDate,
        name: cardholderName,
        // Don't save CVV for security reasons
      };

      // Get existing cards
      const savedCardsData = await SecureStore.getItemAsync(`saved_cards_${user?.id}`);
      let existingCards = [];
      
      if (savedCardsData) {
        existingCards = JSON.parse(savedCardsData);
      }

      // Check if this card already exists (by last 4 digits and expiry)
      const cardExists = existingCards.some((card: any) => 
        card.last4 === newCard.last4 && card.expiryDate === newCard.expiryDate
      );

      if (!cardExists) {
        // Add new card to the beginning of the array
        existingCards.unshift(newCard);
        
        // Keep only the last 5 cards
        if (existingCards.length > 5) {
          existingCards = existingCards.slice(0, 5);
        }
        
        await SecureStore.setItemAsync(`saved_cards_${user?.id}`, JSON.stringify(existingCards));
      }
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  useEffect(() => {
    fetchSpots();
    requestLocationPermission();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('parking_spots_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parking_spots',
        },
        () => {
          fetchSpots();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location permission is needed to show your position on the map and find nearby parking spots.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Settings',
              onPress: () => Location.requestForegroundPermissionsAsync(),
            },
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation(location);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Using default location.'
      );
    }
  };

  const fetchSpots = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('parking_spots')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching spots:', error);
        
        // Check if it's an authentication error
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          Alert.alert(
            'Authentication Required', 
            'Please log in to view parking spots.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Login', onPress: () => console.log('Navigate to login') }
            ]
          );
          return;
        }
        
        throw error;
      }
      
      setSpots(data || []);
      
      // Auto-center map on first spot if available
      if (data && data.length > 0) {
        const firstSpot = data[0];
        setMapRegion({
          latitude: firstSpot.latitude,
          longitude: firstSpot.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('💥 Error fetching spots:', error);
      Alert.alert('Error', `Failed to load parking spots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSpots(false); // Don't show loading spinner during refresh
    } catch (error) {
      console.error('Error refreshing parking spots:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // NEW: Show payment modal with proper date initialization for future booking
  const showPaymentModal = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    
    // Initialize with the next available hour for future booking
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    nextHour.setMilliseconds(0);
    
    // Set start time to next hour (allows future date booking)
    setStartDate(nextHour);
    
    // Set end time to 1 hour after start (minimum booking duration)
    const endTime = new Date(nextHour);
    endTime.setHours(nextHour.getHours() + 1);
    setEndDate(endTime);
    
    // Set default payment method based on wallet balance
    const estimatedCost = parseFloat(calculatePrice(nextHour, endTime));
    setUseWalletPayment(walletBalance >= estimatedCost);
    
    setPaymentModalVisible(true);
  };

  // Close payment modal and reset form with future dates
  const closePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedSpot(null); // Clear selected spot
    
    // Reset to next available hour for future booking capability
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    nextHour.setMilliseconds(0);
    
    setStartDate(nextHour);
    const endHour = new Date(nextHour);
    endHour.setHours(nextHour.getHours() + 1);
    setEndDate(endHour);
    
    setShowStartDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndDatePicker(false);
    setShowEndTimePicker(false);
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');
    setSaveCard(false);
    setUseWalletPayment(false);
    setProcessing(false);
    setSelectedSavedCard(null);
    setShowNewCardForm(false);
  };

  // Calculate price based on time difference
  const calculatePrice = (start: Date, end: Date) => {
    const hoursDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const basePrice = 1; // $1 per hour
    return (Math.ceil(hoursDiff) * basePrice).toFixed(2);
  };

  // NEW: Process payment and create booking
  const processPayment = async () => {
    if (!user || !selectedSpot) return;

    const bookingAmount = parseFloat(calculatePrice(startDate, endDate));

    // Validate time selection first
    const now = new Date();
    const roundedNow = new Date(now);
    roundedNow.setMinutes(0);
    roundedNow.setSeconds(0);
    roundedNow.setMilliseconds(0);

    if (startDate < roundedNow) {
      Alert.alert('Invalid Time', 'Please select a future start time');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }

    const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000);
    if (endDate < minEndTime) {
      Alert.alert('Invalid Duration', 'Minimum booking duration is 1 hour');
      return;
    }

    setProcessing(true);

    try {
      let paymentSuccess = false;
      let paymentMethod = '';

      // Check if user wants to use wallet and has sufficient balance
      if (useWalletPayment && walletBalance >= bookingAmount) {
        // Use wallet payment
        paymentSuccess = await deductFunds(bookingAmount, `Parking booking at ${selectedSpot.title}`);
        paymentMethod = `wallet (balance: $${(walletBalance - bookingAmount).toFixed(2)})`;
      } else if (useWalletPayment && walletBalance < bookingAmount) {
        Alert.alert(
          'Insufficient Balance',
          `You need $${bookingAmount.toFixed(2)} but only have $${walletBalance.toFixed(2)} in your wallet. Please use a card or top up your wallet.`
        );
        setProcessing(false);
        return;
      } else {
        // Use card payment - validate card details
        if (selectedSavedCard) {
          // Using a saved card, only need CVV
          if (!cvv) {
            Alert.alert('Error', 'Please enter CVV for the saved card');
            setProcessing(false);
            return;
          }
          if (cvv.length !== 3) {
            Alert.alert('Error', 'Please enter a valid 3-digit CVV');
            setProcessing(false);
            return;
          }
        } else {
          // Using new card details
          if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
            Alert.alert('Error', 'Please fill in all card details');
            setProcessing(false);
            return;
          }

          if (cardNumber.replace(/\s/g, '').length !== 16) {
            Alert.alert('Error', 'Please enter a valid 16-digit card number');
            setProcessing(false);
            return;
          }

          if (cvv.length !== 3) {
            Alert.alert('Error', 'Please enter a valid 3-digit CVV');
            setProcessing(false);
            return;
          }

          if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
            Alert.alert('Error', 'Please enter expiry date in MM/YY format');
            setProcessing(false);
            return;
          }

          if (!validateExpiryDate(expiryDate)) {
            setProcessing(false);
            return;
          }
        }

        // Simulate card payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));
        paymentSuccess = true;
        
        if (selectedSavedCard) {
          paymentMethod = `saved card ending in ${selectedSavedCard.last4}`;
        } else {
          paymentMethod = `card ending in ${cardNumber.slice(-4)}`;
          // Save new card details if requested
          if (saveCard) {
            await savePaymentDetails();
          }
        }
      }

      if (!paymentSuccess) {
        Alert.alert('Payment Failed', 'Failed to process payment. Please try again.');
        setProcessing(false);
        return;
      }

      // Create booking in database
      const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        spot_id: selectedSpot.id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'confirmed',
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        `Parking booked successfully! Paid $${bookingAmount.toFixed(2)} using ${paymentMethod}.`
      );
      closePaymentModal();
      setSelectedSpot(null);
      fetchSpots();
    } catch (error) {
      console.error('Error booking spot:', error);
      Alert.alert('Error', 'Failed to process payment and book parking spot');
    } finally {
      setProcessing(false);
    }
  };

  // NEW: Format card number input
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  // Format and validate expiry date input
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length >= 1) {
      const month = parseInt(cleaned.substring(0, 2));
      // Validate month (1-12)
      if (cleaned.length >= 2) {
        if (month < 1 || month > 12) {
          Alert.alert('Invalid Month', 'Please enter a valid month (1-12)');
          return;
        }
      }

      // Validate year (2025+)
      if (cleaned.length >= 4) {
        const year = parseInt('20' + cleaned.substring(2, 4));
        if (year < 2025) {
          Alert.alert('Invalid Year', 'Year must be 2025 or later');
          return;
        }
      }
    }

    // Format as MM/YY
    if (cleaned.length <= 4) {
      let formatted = cleaned;
      if (cleaned.length >= 2) {
        formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
      }
      setExpiryDate(formatted);
    }
  };

  // Validate expiry date before processing payment
  const validateExpiryDate = (expiry: string): boolean => {
    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr);
    const year = parseInt('20' + yearStr);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (month < 1 || month > 12) {
      Alert.alert('Invalid Month', 'Please enter a valid month (1-12)');
      return false;
    }

    if (year < 2025) {
      Alert.alert('Invalid Year', 'Year must be 2025 or later');
      return false;
    }

    if (year === currentYear && month < currentMonth) {
      Alert.alert('Expired Card', 'The card has expired');
      return false;
    }

    return true;
  };

  // Handle start date selection
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const newStartDate = new Date(selectedDate);
      newStartDate.setHours(startDate.getHours());
      newStartDate.setMinutes(0); // Always use whole hours

      // Check if selected date is in the past
      const now = new Date();
      const roundedNow = new Date(now);
      roundedNow.setMinutes(0);
      roundedNow.setSeconds(0);
      roundedNow.setMilliseconds(0);

      if (newStartDate < roundedNow) {
        Alert.alert('Invalid Date', 'Start date cannot be in the past');
        return;
      }

      setStartDate(newStartDate);

      // Adjust end date to be 1 hour after start
      const newEndDate = new Date(newStartDate);
      newEndDate.setHours(newStartDate.getHours() + 1);
      setEndDate(newEndDate);
    }
  };

  // Handle start time selection
  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newStartDate = new Date(startDate);
      newStartDate.setHours(selectedTime.getHours());
      newStartDate.setMinutes(0); // Always use whole hours

      // Check if selected time is in the past
      const now = new Date();
      const roundedNow = new Date(now);
      roundedNow.setMinutes(0);
      roundedNow.setSeconds(0);
      roundedNow.setMilliseconds(0);

      if (newStartDate < roundedNow) {
        Alert.alert('Invalid Time', 'Start time cannot be in the past');
        return;
      }

      setStartDate(newStartDate);

      // Adjust end date to be 1 hour after start
      const newEndDate = new Date(newStartDate);
      newEndDate.setHours(newStartDate.getHours() + 1);
      setEndDate(newEndDate);
    }
  };  // Handle end date selection
  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const newEndDate = new Date(selectedDate);
      newEndDate.setHours(endDate.getHours());
      newEndDate.setMinutes(0); // Always use whole hours

      // Must be at least 1 hour after start
      const minEndDate = new Date(startDate);
      minEndDate.setHours(startDate.getHours() + 1);

      if (newEndDate < minEndDate) {
        Alert.alert('Invalid Date', 'End date must be at least 1 hour after start date');
        return;
      }

      setEndDate(newEndDate);
    }
  };

  // Handle end time selection
  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const newEndDate = new Date(endDate);
      newEndDate.setHours(selectedTime.getHours());
      newEndDate.setMinutes(0); // Always use whole hours

      // Calculate minimum end time (1 hour after start)
      const minEndDate = new Date(startDate);
      minEndDate.setHours(startDate.getHours() + 1);

      if (newEndDate <= startDate) {
        Alert.alert('Invalid Time', 'End time must be after start time');
        return;
      }

      // Ensure whole hours only
      const hoursDiff = (newEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      if (hoursDiff % 1 !== 0) {
        const roundedEndDate = new Date(startDate);
        roundedEndDate.setHours(startDate.getHours() + Math.ceil(hoursDiff));
        setEndDate(roundedEndDate);
        Alert.alert('Notice', 'Time has been rounded to the next hour');
        return;
      }

      setEndDate(newEndDate);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time for display with only hours
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Round time to nearest hour and ensure it's in the future
  const roundToNextHour = (date: Date) => {
    const now = new Date();
    const rounded = new Date(date);
    rounded.setMinutes(0);
    rounded.setSeconds(0);
    rounded.setMilliseconds(0);
    
    // If the time is in the past, move to next hour
    if (rounded < now) {
      rounded.setHours(rounded.getHours() + 1);
    }
    
    return rounded;
  };

  const bookSpot = async (spot: ParkingSpot) => {
    // MODIFIED: Now just shows payment modal instead of direct booking
    showPaymentModal(spot);
  };

  // Constants to avoid React Native parser issues
  const MAP_MODE = 'map';
  const WEB_PLATFORM = 'web';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading parking spots...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Nearby Parking</Text>
            <Text style={styles.subtitle}>
              {spots.filter((s) => s.is_available).length} of {spots.length} spots available
            </Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'map' && styles.toggleButtonActive,
                ]}
                onPress={() => setViewMode('map')}
              >
                <MapIcon
                  size={20}
                  color={viewMode === 'map' ? '#FFFFFF' : '#6B7280'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'list' && styles.toggleButtonActive,
                ]}
                onPress={() => setViewMode('list')}
              >
                <List
                  size={20}
                  color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {viewMode === MAP_MODE ? (
        <View style={styles.mapContainer}>
          {Platform.OS !== WEB_PLATFORM ? (
            <MapComponent
              spots={spots}
              mapRegion={mapRegion}
              onRegionChange={setMapRegion}
              selectedSpotId={selectedSpot?.id || null}
              onSpotPress={(spot: any) => {
                setSelectedSpot(spot);
                if (spot.is_available) {
                  showPaymentModal(spot);
                } else {
                  Alert.alert(
                    'Parking Unavailable',
                    'Sorry, this parking spot is currently occupied and not available for booking.',
                    [{ text: 'OK' }]
                  );
                }
              }}
              onLocationPress={requestLocationPermission}
              style={styles.map}
            />
          ) : (
            <MapComponent
              onSwitchToList={() => setViewMode('list')}
              style={styles.map}
            />
          )}
          
          {/* Refresh Button for Map View */}
          <TouchableOpacity
            style={[
              styles.refreshButton,
              refreshing && { opacity: 0.7 }
            ]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw 
              size={20} 
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.spotsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563EB']} // Android
              tintColor="#2563EB" // iOS
            />
          }
        >
          {spots.map((spot) => (
            <TouchableOpacity
              key={spot.id}
              style={[
                styles.spotCard,
                !spot.is_available && styles.unavailableSpot,
                selectedSpot?.id === spot.id && styles.selectedSpot,
              ]}
              onPress={() => setSelectedSpot(spot)}
            >
              <View style={styles.spotHeader}>
                <View style={styles.spotInfo}>
                  <Text style={styles.spotTitle}>{spot.title}</Text>
                  <Text style={styles.spotDescription}>{spot.description}</Text>
                </View>
                <View style={styles.availabilityBadge}>
                  {spot.is_available ? (
                    <CheckCircle size={20} color="#059669" />
                  ) : (
                    <XCircle size={20} color="#DC2626" />
                  )}
                </View>
              </View>

              <View style={styles.spotDetails}>
                <View style={styles.locationInfo}>
                  <Navigation size={16} color="#6B7280" />
                  <Text style={styles.locationText}>
                    {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.statusText,
                    spot.is_available
                      ? styles.availableText
                      : styles.unavailableText,
                  ]}
                >
                  {spot.is_available ? 'Available' : 'Occupied'}
                </Text>
              </View>

              {selectedSpot?.id === spot.id && spot.is_available && (
                <View style={styles.bookingSection}>
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => bookSpot(spot)}
                  >
                    <Text style={styles.bookButtonText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalContent}>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Payment Details</Text>
                  <TouchableOpacity onPress={closePaymentModal}>
                    <CloseIcon size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Booking Info */}
                {selectedSpot && (
                  <View style={styles.bookingInfoCard}>
                    <Text style={styles.bookingInfoTitle}>
                      {selectedSpot.title}
                    </Text>
                    <Text style={styles.priceAmount}>
                      ${calculatePrice(startDate, endDate)} total
                    </Text>
                  </View>
                )}

                {/* Date & Time Selection */}
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.sectionTitle}>Select Parking Time</Text>
                  
                  {/* Start Time Selection */}
                  <Text style={styles.subsectionTitle}>Start Time</Text>
                  <View style={styles.dateTimeRow}>
                    <View style={styles.dateTimeField}>
                      <Text style={styles.inputLabel}>Date</Text>
                      <TouchableOpacity 
                        style={styles.dateTimePicker}
                        onPress={() => setShowStartDatePicker(true)}
                      >
                        <Text style={styles.dateTimeText}>
                          {formatDate(startDate)}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dateTimeField}>
                      <Text style={styles.inputLabel}>Time</Text>
                      <TouchableOpacity 
                        style={styles.dateTimePicker}
                        onPress={() => setShowStartTimePicker(true)}
                      >
                        <Text style={styles.dateTimeText}>
                          {formatTime(startDate)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* End Time Selection */}
                  <Text style={[styles.subsectionTitle, { marginTop: 16 }]}>End Time</Text>
                  <View style={styles.dateTimeRow}>
                    <View style={styles.dateTimeField}>
                      <Text style={styles.inputLabel}>Date</Text>
                      <TouchableOpacity 
                        style={styles.dateTimePicker}
                        onPress={() => setShowEndDatePicker(true)}
                      >
                        <Text style={styles.dateTimeText}>
                          {formatDate(endDate)}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dateTimeField}>
                      <Text style={styles.inputLabel}>Time</Text>
                      <TouchableOpacity 
                        style={styles.dateTimePicker}
                        onPress={() => setShowEndTimePicker(true)}
                      >
                        <Text style={styles.dateTimeText}>
                          {formatTime(endDate)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Price Display */}
                  <View style={styles.priceDisplayContainer}>
                    <Text style={styles.priceDisplayLabel}>
                      Total Duration: {formatDuration(startDate, endDate)}
                    </Text>
                    <Text style={styles.priceDisplayAmount}>
                      Total Price: ${calculatePrice(startDate, endDate)}
                    </Text>
                  </View>

                  {/* Date Time Pickers */}
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      onChange={onStartDateChange}
                      minimumDate={new Date()}
                    />
                  )}

                  {showStartTimePicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="time"
                      onChange={onStartTimeChange}
                    />
                  )}

                  {showEndDatePicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      onChange={onEndDateChange}
                      minimumDate={startDate}
                    />
                  )}

                  {showEndTimePicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="time"
                      onChange={onEndTimeChange}
                    />
                  )}
                </View>

                {/* Payment Method Selection */}
                <View style={styles.formContainer}>
                  <Text style={styles.sectionTitle}>Payment Method</Text>
                  
                  {/* Wallet Option */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      useWalletPayment && styles.paymentOptionSelected
                    ]}
                    onPress={() => setUseWalletPayment(true)}
                  >
                    <Wallet size={20} color={useWalletPayment ? '#2563EB' : '#6B7280'} />
                    <View style={styles.paymentOptionInfo}>
                      <Text style={[
                        styles.paymentOptionTitle,
                        useWalletPayment && styles.paymentOptionTitleSelected
                      ]}>
                        Wallet Balance
                      </Text>
                      <Text style={[
                        styles.paymentOptionBalance,
                        walletBalance >= parseFloat(calculatePrice(startDate, endDate)) ? 
                          styles.sufficientBalance : styles.insufficientBalance
                      ]}>
                        Available: ${walletBalance.toFixed(2)}
                        {walletBalance >= parseFloat(calculatePrice(startDate, endDate)) ? 
                          ' ✓' : ' (Insufficient)'}
                      </Text>
                    </View>
                    {useWalletPayment && <View style={styles.selectedIndicator} />}
                  </TouchableOpacity>

                  {/* Card Option */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      !useWalletPayment && styles.paymentOptionSelected
                    ]}
                    onPress={() => setUseWalletPayment(false)}
                  >
                    <CreditCard size={20} color={!useWalletPayment ? '#2563EB' : '#6B7280'} />
                    <View style={styles.paymentOptionInfo}>
                      <Text style={[
                        styles.paymentOptionTitle,
                        !useWalletPayment && styles.paymentOptionTitleSelected
                      ]}>
                        Credit/Debit Card
                      </Text>
                      <Text style={styles.paymentOptionSubtitle}>
                        Pay with your card
                      </Text>
                    </View>
                    {!useWalletPayment && <View style={styles.selectedIndicator} />}
                  </TouchableOpacity>
                </View>

                {/* Card Information Form - Only show if card payment is selected */}
                {!useWalletPayment && (
                <View style={styles.formContainer}>
                  <Text style={styles.sectionTitle}>Card Information</Text>

                  {/* Saved Cards Section */}
                  {savedCards.length > 0 && (
                    <View style={styles.savedCardsContainer}>
                      <Text style={styles.subsectionTitle}>Saved Cards</Text>
                      {savedCards.map((card, index) => (
                        <TouchableOpacity
                          key={card.id || index}
                          style={[
                            styles.savedCardItem,
                            selectedSavedCard?.id === card.id && styles.savedCardItemSelected
                          ]}
                          onPress={() => {
                            setSelectedSavedCard(card);
                            setShowNewCardForm(false);
                            // Clear new card form
                            setCardNumber('');
                            setExpiryDate('');
                            setCardholderName('');
                            setCvv('');
                          }}
                        >
                          <View style={styles.savedCardInfo}>
                            <Text style={styles.savedCardNumber}>
                              •••• •••• •••• {card.last4}
                            </Text>
                            <Text style={styles.savedCardDetails}>
                              {card.cardHolderName || card.name} • Expires {card.expiryDate || card.expiry}
                            </Text>
                          </View>
                          {selectedSavedCard?.id === card.id && (
                            <View style={styles.selectedIndicator} />
                          )}
                        </TouchableOpacity>
                      ))}
                      
                      {/* CVV for selected saved card */}
                      {selectedSavedCard && (
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>CVV for selected card</Text>
                          <TextInput
                            style={styles.textInput}
                            value={cvv}
                            onChangeText={(text) => {
                              const cleaned = text.replace(/\D/g, '');
                              if (cleaned.length <= 3) setCvv(cleaned);
                            }}
                            placeholder="123"
                            keyboardType="numeric"
                            secureTextEntry
                          />
                        </View>
                      )}
                      
                      {/* Add New Card Button */}
                      <TouchableOpacity
                        style={styles.addNewCardButton}
                        onPress={() => {
                          setShowNewCardForm(true);
                          setSelectedSavedCard(null);
                          setCvv('');
                        }}
                      >
                        <Text style={styles.addNewCardText}>+ Add New Card</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* New Card Form */}
                  {(savedCards.length === 0 || showNewCardForm) && (
                    <View>
                      {savedCards.length > 0 && (
                        <Text style={styles.subsectionTitle}>Add New Card</Text>
                      )}
                      
                      {/* Card Number */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Card Number</Text>
                        <TextInput
                          style={styles.textInput}
                          value={cardNumber}
                          onChangeText={formatCardNumber}
                          placeholder="1234 5678 9012 3456"
                          keyboardType="numeric"
                        />
                      </View>

                      {/* Expiry and CVV */}
                      <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                          <Text style={styles.inputLabel}>Expiry</Text>
                          <TextInput
                            style={styles.textInput}
                            value={expiryDate}
                            onChangeText={formatExpiryDate}
                            placeholder="MM/YY"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                          <Text style={styles.inputLabel}>CVV</Text>
                          <TextInput
                            style={styles.textInput}
                            value={cvv}
                            onChangeText={(text) => {
                              const cleaned = text.replace(/\D/g, '');
                              if (cleaned.length <= 3) setCvv(cleaned);
                            }}
                            placeholder="123"
                            keyboardType="numeric"
                            secureTextEntry
                          />
                        </View>
                      </View>

                      {/* Cardholder Name */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Cardholder Name</Text>
                        <TextInput
                          style={styles.textInput}
                          value={cardholderName}
                          onChangeText={setCardholderName}
                          placeholder="John Doe"
                          autoCapitalize="words"
                        />
                      </View>

                      {/* Save Card Option */}
                      <TouchableOpacity
                        style={styles.saveCardContainer}
                        onPress={() => setSaveCard(!saveCard)}
                      >
                        <View style={[
                          styles.checkbox,
                          saveCard && styles.checkboxChecked
                        ]}>
                        {saveCard && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.saveCardText}>
                        Save card details for future payments
                      </Text>
                    </TouchableOpacity>
                  </View>
                  )}
                </View>
                )}
              </ScrollView>

              {/* Payment Button - Outside ScrollView to stay fixed */}
              <View style={styles.paymentButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    processing && styles.paymentButtonDisabled,
                  ]}
                  onPress={processPayment}
                  disabled={processing}
                >
                  <Text style={styles.paymentButtonText}>
                    {processing
                      ? 'Processing...'
                      : `${useWalletPayment ? 'Pay from Wallet' : 'Pay with Card'} - $${calculatePrice(startDate, endDate)}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper function to format duration
const formatDuration = (start: Date, end: Date) => {
  const diff = end.getTime() - start.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

// Create responsive styles based on screen dimensions
const createStyles = (screenWidth: number, screenHeight: number) => {
  const isSmallScreen = screenWidth < 375;
  const isVerySmallScreen = screenWidth < 320;
  const isShortScreen = screenHeight < 700;

  return StyleSheet.create({
  // Save Card Styles
  saveCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveCardText: {
    fontSize: 14,
    color: '#4B5563',
  },

  // Payment Method Styles
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  paymentOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EBF4FF',
  },
  paymentOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  paymentOptionTitleSelected: {
    color: '#2563EB',
  },
  paymentOptionBalance: {
    fontSize: 14,
    marginTop: 2,
  },
  paymentOptionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  sufficientBalance: {
    color: '#059669',
  },
  insufficientBalance: {
    color: '#DC2626',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },

  // Date Time Picker Styles
  dateTimeContainer: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  priceDisplayContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  priceDisplayLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  priceDisplayAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateTimeField: {
    flex: 1,
    marginRight: 8,
  },
  dateTimePicker: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1F2937',
  },
  paymentButtonContainer: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
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
  },
  header: {
    paddingHorizontal: isSmallScreen ? 16 : 24,
    paddingVertical: isShortScreen ? 12 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: isVerySmallScreen ? 20 : isSmallScreen ? 22 : 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#6B7280',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: isSmallScreen ? 8 : 12,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#2563EB',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  spotsList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  spotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unavailableSpot: {
    opacity: 0.7,
  },
  selectedSpot: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  spotInfo: {
    flex: 1,
    marginRight: 12,
  },
  spotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  spotDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  availabilityBadge: {
    padding: 4,
  },
  spotDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  availableText: {
    color: '#059669',
  },
  unavailableText: {
    color: '#DC2626',
  },
  bookingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Payment Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  bookingInfoCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  bookingInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  formContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
  },
  paymentButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  paymentButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Hour Selection Styles
  hourSelectionContainer: {
    marginBottom: 20,
  },
  hourScrollView: {
    flexDirection: 'row',
  },
  hourButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  hourButtonSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#2563EB',
  },
  hourButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  hourButtonTextSelected: {
    color: '#2563EB',
  },
  hourButtonPrice: {
    fontSize: 12,
    color: '#6B7280',
  },
  hourButtonPriceSelected: {
    color: '#2563EB',
  },
  // Map Callout Styles
  calloutContainer: {
    width: 220,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calloutStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  calloutAvailable: {
    color: '#059669',
  },
  calloutUnavailable: {
    color: '#DC2626',
  },
  calloutButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  calloutButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Custom Marker Styles
  customMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Location Button
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2563EB',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  // Refresh Button for Map
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#2563EB',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  // Web Map Fallback Styles
  webMapFallback: {
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapMessage: {
    alignItems: 'center',
    padding: 40,
  },
  webMapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  webMapDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  switchToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  switchToListText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Saved Cards Styles
  savedCardsContainer: {
    marginBottom: 20,
  },
  savedCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  savedCardItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EBF4FF',
  },
  savedCardInfo: {
    flex: 1,
  },
  savedCardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  savedCardDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  addNewCardButton: {
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 8,
  },
  addNewCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
};