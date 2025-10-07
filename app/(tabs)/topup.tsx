import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { 
  Wallet, 
  CreditCard, 
  DollarSign, 
  ArrowUp, 
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react-native';

// Screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 360;

// Predefined top-up amounts
const TOP_UP_AMOUNTS = [
  { value: 10, label: '$10' },
  { value: 25, label: '$25' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
  { value: 200, label: '$200' },
  { value: 500, label: '$500' },
];

export default function TopUpScreen() {
  const { user } = useAuth();
  const { balance: walletBalance, addFunds, refreshBalance } = useWallet();
  const insets = useSafeAreaInsets();
  
  // Top-up states
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Payment method states
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [saveCardDetails, setSaveCardDetails] = useState(false);
  
  // Saved cards states
  const [savedCards, setSavedCards] = useState<Array<{
    id: string;
    last4: string;
    brand: string;
    expiryDate: string;
    cardHolderName: string;
  }>>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(true);

  useEffect(() => {
    loadSavedCards();
    refreshBalance();
  }, []);

  // Load saved cards
  const loadSavedCards = async () => {
    if (!user) return;
    
    try {
      // Fetch saved cards from Supabase for the current user
      const { data, error } = await supabase
        .from('saved_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved cards:', error);
        // If table doesn't exist or there's an error, fall back to SecureStore
        const savedCardData = await SecureStore.getItemAsync(`saved_cards_${user.id}`);
        if (savedCardData) {
          const parsedCards = JSON.parse(savedCardData);
          // Ensure compatibility with cards saved from booking page
          const normalizedCards = parsedCards.map((card: any) => ({
            id: card.id,
            last4: card.last4,
            brand: card.brand || 'Card',
            expiryDate: card.expiryDate || card.expiry,
            cardHolderName: card.cardHolderName || card.name,
            // Keep original fields for backward compatibility
            ...card
          }));
          setSavedCards(normalizedCards);
        } else {
          setSavedCards([]);
        }
        return;
      }

      // Transform Supabase data to match our card format
      const transformedCards = data?.map((card: any) => ({
        id: card.id,
        last4: card.last4,
        brand: card.brand,
        expiryDate: card.expiry_date,
        cardHolderName: card.cardholder_name
      })) || [];

      setSavedCards(transformedCards);
    } catch (error) {
      console.error('Error loading saved cards:', error);
      setSavedCards([]);
    }
  };

  // Get card brand from number
  const getCardBrand = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'Visa';
    if (cleanNumber.startsWith('5')) return 'Mastercard';
    if (cleanNumber.startsWith('3')) return 'Amex';
    return 'Card';
  };

  // Format card number
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  // Format expiry date
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length >= 1) {
      const month = parseInt(cleaned.substring(0, 2));
      if (cleaned.length >= 2 && (month < 1 || month > 12)) {
        Alert.alert('Invalid Month', 'Please enter a valid month (01-12)');
        return;
      }
    }

    if (cleaned.length <= 4) {
      let formatted = cleaned;
      if (cleaned.length >= 2) {
        formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
      }
      setExpiryDate(formatted);
    }
  };

  // Validate card details
  const validateCardDetails = (): boolean => {
    if (selectedCardId) return true; // Using saved card

    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number');
      return false;
    }

    if (!expiryDate || !expiryDate.match(/^\d{2}\/\d{2}$/)) {
      Alert.alert('Invalid Expiry', 'Please enter expiry date in MM/YY format');
      return false;
    }

    if (!cvv || cvv.length !== 3) {
      Alert.alert('Invalid CVV', 'Please enter a valid 3-digit CVV');
      return false;
    }

    if (!cardHolderName.trim()) {
      Alert.alert('Invalid Name', 'Please enter the cardholder name');
      return false;
    }

    return true;
  };

  // Save new card
  const saveCard = async () => {
    if (!validateCardDetails() || selectedCardId || !user) return;

    const newCard = {
      id: Date.now().toString(),
      last4: cardNumber.slice(-4),
      brand: getCardBrand(cardNumber),
      expiryDate,
      cardHolderName,
      // Legacy fields for compatibility with booking page
      number: cardNumber,
      expiry: expiryDate,
      name: cardHolderName,
    };

    try {
      // Try to save to Supabase first
      const { data, error } = await supabase
        .from('saved_cards')
        .insert([
          {
            user_id: user.id,
            last4: newCard.last4,
            brand: newCard.brand,
            expiry_date: newCard.expiryDate,
            cardholder_name: newCard.cardHolderName,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving card to Supabase:', error);
        // Fallback to SecureStore
        const currentCards = await SecureStore.getItemAsync(`saved_cards_${user.id}`);
        const cards = currentCards ? JSON.parse(currentCards) : [];
        const updatedCards = [...cards, newCard];
        await SecureStore.setItemAsync(`saved_cards_${user.id}`, JSON.stringify(updatedCards));
      } else if (data) {
        // Update newCard with actual database ID
        newCard.id = data.id;
      }

      const updatedCards = [...savedCards, newCard];
      setSavedCards(updatedCards);
      
      console.log('Card saved for user:', user.id, newCard);
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Failed to save card details');
    }
  };

  // Delete saved card
  const deleteCard = (cardId: string) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;

            try {
              // Try to delete from Supabase
              const { error } = await supabase
                .from('saved_cards')
                .delete()
                .eq('id', cardId)
                .eq('user_id', user.id); // Ensure user can only delete their own cards

              if (error) {
                console.error('Error deleting card from Supabase:', error);
                // Fallback to SecureStore
                const currentCards = await SecureStore.getItemAsync(`saved_cards_${user.id}`);
                if (currentCards) {
                  const cards = JSON.parse(currentCards);
                  const updatedCards = cards.filter((card: any) => card.id !== cardId);
                  await SecureStore.setItemAsync(`saved_cards_${user.id}`, JSON.stringify(updatedCards));
                }
              }

              // Update local state
              const updatedCards = savedCards.filter(card => card.id !== cardId);
              setSavedCards(updatedCards);
              
              if (selectedCardId === cardId) {
                setSelectedCardId(null);
              }
              
              Alert.alert('Success', 'Payment method removed successfully');
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

  // Handle amount selection
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  // Handle custom amount input
  const handleCustomAmountChange = (text: string) => {
    setCustomAmount(text);
    setSelectedAmount(null);
  };

  // Get final amount
  const getFinalAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    return parseFloat(customAmount) || 0;
  };

  // Handle top-up
  const handleTopUp = async () => {
    const amount = getFinalAmount();
    
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please select or enter a valid amount');
      return;
    }

    if (amount > 1000) {
      Alert.alert('Limit Exceeded', 'Maximum top-up amount is $1000');
      return;
    }

    if (!validateCardDetails()) {
      return;
    }

    setProcessing(true);

    try {
      // Save card if requested and using new card
      if (saveCardDetails && !selectedCardId) {
        await saveCard();
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add funds to wallet
      const success = await addFunds(amount);
      
      if (success) {
        const paymentMethod = selectedCardId ? 
          savedCards.find(card => card.id === selectedCardId) :
          { last4: cardNumber.slice(-4), brand: getCardBrand(cardNumber) };
        
        Alert.alert(
          'Top-up Successful!', 
          `$${amount.toFixed(2)} has been added to your wallet using ${paymentMethod?.brand} ending in ${paymentMethod?.last4}.`
        );
        
        // Reset form
        setSelectedAmount(null);
        setCustomAmount('');
        setCardNumber('');
        setExpiryDate('');
        setCvv('');
        setCardHolderName('');
        setSaveCardDetails(false);
        setSelectedCardId(null);
      } else {
        Alert.alert('Error', 'Failed to add funds to your wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error processing top-up:', error);
      Alert.alert('Payment Failed', 'Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={true}
          alwaysBounceVertical={true}
          scrollEventThrottle={16}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Wallet size={28} color="#2563EB" />
            </View>
            <Text style={styles.headerTitle}>Top Up Wallet</Text>
            <Text style={styles.headerSubtitle}>
              Add funds to your parking wallet
            </Text>
          </View>

          {/* Current Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>${walletBalance.toFixed(2)}</Text>
          </View>

          {/* Amount Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Amount</Text>
            
            {/* Preset Amounts */}
            <View style={styles.amountGrid}>
              {TOP_UP_AMOUNTS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.amountButton,
                    selectedAmount === item.value && styles.amountButtonSelected
                  ]}
                  onPress={() => handleAmountSelect(item.value)}
                >
                  <Text style={[
                    styles.amountButtonText,
                    selectedAmount === item.value && styles.amountButtonTextSelected
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount */}
            <View style={styles.customAmountContainer}>
              <Text style={styles.customAmountLabel}>Or enter custom amount</Text>
              <View style={styles.customAmountInputContainer}>
                <DollarSign size={20} color="#6B7280" />
                <TextInput
                  style={styles.customAmountInput}
                  placeholder="0.00"
                  value={customAmount}
                  onChangeText={handleCustomAmountChange}
                  keyboardType="decimal-pad"
                  maxLength={7}
                />
              </View>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            {/* Saved Cards */}
            {savedCards.length > 0 && (
              <View style={styles.savedCardsContainer}>
                <Text style={styles.sectionSubtitle}>Saved Cards</Text>
                {savedCards.map((card) => (
                  <View key={card.id} style={styles.savedCardContainer}>
                    <TouchableOpacity
                      style={[
                        styles.savedCardItem,
                        selectedCardId === card.id && styles.savedCardItemSelected
                      ]}
                      onPress={() => {
                        setSelectedCardId(selectedCardId === card.id ? null : card.id);
                        setShowNewCardForm(selectedCardId !== card.id);
                      }}
                    >
                      <CreditCard size={20} color="#6B7280" />
                      <View style={styles.savedCardInfo}>
                        <Text style={styles.savedCardText}>
                          {card.brand} •••• {card.last4}
                        </Text>
                        <Text style={styles.savedCardExpiry}>{card.expiryDate}</Text>
                      </View>
                      {selectedCardId === card.id && (
                        <CheckCircle2 size={20} color="#2563EB" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteCardButton}
                      onPress={() => deleteCard(card.id)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.addNewCardButton}
                  onPress={() => {
                    setShowNewCardForm(!showNewCardForm);
                    setSelectedCardId(null);
                  }}
                >
                  <Plus size={16} color="#2563EB" />
                  <Text style={styles.addNewCardText}>
                    {showNewCardForm ? 'Hide New Card Form' : 'Add New Card'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* New Card Form */}
            {showNewCardForm && (
              <View style={styles.newCardForm}>
                <Text style={styles.sectionSubtitle}>
                  {savedCards.length > 0 ? 'New Card Details' : 'Card Details'}
                </Text>
                
                {/* Card Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChangeText={formatCardNumber}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                {/* Expiry and CVV */}
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, styles.inputHalf]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChangeText={formatExpiryDate}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.inputHalf]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      value={cvv}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, '');
                        if (cleaned.length <= 3) setCvv(cleaned);
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* Cardholder Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cardholder Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    value={cardHolderName}
                    onChangeText={setCardHolderName}
                    autoCapitalize="words"
                  />
                </View>

                {/* Save Card Option */}
                <TouchableOpacity
                  style={styles.saveCardContainer}
                  onPress={() => setSaveCardDetails(!saveCardDetails)}
                >
                  <View style={[
                    styles.checkbox,
                    saveCardDetails && styles.checkboxChecked
                  ]}>
                    {saveCardDetails && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.saveCardText}>
                    Save card for future payments
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Top-up Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.topUpButton,
                (processing || getFinalAmount() <= 0) && styles.topUpButtonDisabled
              ]}
              onPress={handleTopUp}
              disabled={processing || getFinalAmount() <= 0}
            >
              <ArrowUp size={20} color="#FFFFFF" />
              <Text style={styles.topUpButtonText}>
                {processing 
                  ? 'Processing...' 
                  : `Top Up $${getFinalAmount().toFixed(2)}`
                }
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    minHeight: '100%',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  amountButton: {
    width: '31.33%',
    marginHorizontal: '1%',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  amountButtonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EBF4FF',
  },
  amountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  amountButtonTextSelected: {
    color: '#2563EB',
  },
  customAmountContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  customAmountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  customAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 8,
  },
  savedCardsContainer: {
    marginBottom: 24,
  },
  savedCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedCardItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  savedCardItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EBF4FF',
  },
  savedCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  savedCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  savedCardExpiry: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  deleteCardButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  addNewCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  addNewCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563EB',
    marginLeft: 8,
  },
  newCardForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  saveCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  buttonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginTop: 24,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topUpButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topUpButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  topUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});