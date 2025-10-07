import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

interface WalletContextType {
  balance: number;
  loading: boolean;
  addFunds: (amount: number) => Promise<boolean>;
  deductFunds: (amount: number, description: string) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  getBalance: () => number;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load wallet balance when user changes
  useEffect(() => {
    if (user) {
      loadWalletBalance();
    } else {
      setBalance(0);
      setLoading(false);
    }
  }, [user]);

  const loadWalletBalance = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading wallet balance for user:', user.id);
      
      // Try to fetch from Supabase first
      const { data, error } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet balance from Supabase:', error);
        throw error;
      }

      if (data && data.wallet_balance !== null && data.wallet_balance !== undefined) {
        console.log('Loaded wallet balance from Supabase:', data.wallet_balance);
        setBalance(Number(data.wallet_balance));
      } else {
        console.log('No wallet balance found in Supabase, initializing to 0');
        // Initialize wallet balance to 0 if not found
        await initializeWalletBalance();
      }
    } catch (error) {
      console.error('Error loading wallet balance from Supabase:', error);
      // Fallback to AsyncStorage
      try {
        const savedBalance = await AsyncStorage.getItem(`wallet_${user.id}`) || '0';
        const balance = parseFloat(savedBalance);
        console.log('Loaded wallet balance from AsyncStorage:', balance);
        setBalance(balance);
      } catch (storageError) {
        console.error('Error loading from AsyncStorage:', storageError);
        setBalance(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeWalletBalance = async () => {
    if (!user) return;
    
    try {
      // Initialize wallet balance in database
      const { error } = await supabase
        .from('users')
        .update({ wallet_balance: 0 })
        .eq('id', user.id);

      if (error) {
        console.error('Error initializing wallet balance:', error);
      } else {
        console.log('Initialized wallet balance to 0 for user:', user.id);
        setBalance(0);
      }
    } catch (error) {
      console.error('Error initializing wallet balance:', error);
      setBalance(0);
    }
  };

  const saveBalanceToStorage = async (newBalance: number) => {
    if (!user) return;

    try {
      console.log(`Saving wallet balance ${newBalance} to Supabase for user:`, user.id);
      
      // Save to Supabase
      const { error, data } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id)
        .select('wallet_balance');

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Successfully saved to Supabase:', data);
      
      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem(`wallet_${user.id}`, newBalance.toString());
      console.log('Successfully saved to AsyncStorage as backup');
      
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      
      // Fallback to AsyncStorage only
      try {
        await AsyncStorage.setItem(`wallet_${user.id}`, newBalance.toString());
        console.log('Saved to AsyncStorage as fallback');
      } catch (localError) {
        console.error('Error saving to AsyncStorage:', localError);
        throw localError; // Rethrow so the calling function knows it failed
      }
    }
  };

  const addFunds = async (amount: number): Promise<boolean> => {
    if (!user || amount <= 0) {
      console.log('AddFunds failed: No user or invalid amount', { user: !!user, amount });
      return false;
    }

    console.log(`Starting addFunds: $${amount}, current balance: $${balance}`);

    try {
      const newBalance = balance + amount;
      console.log(`Calculated new balance: $${newBalance}`);
      
      // Update local state first
      setBalance(newBalance);
      
      // Then persist to storage
      await saveBalanceToStorage(newBalance);
      
      console.log(`✅ Successfully added $${amount} to wallet. New balance: $${newBalance}`);
      return true;
    } catch (error) {
      console.error('❌ Error adding funds:', error);
      
      // Revert balance on error and reload from storage
      console.log('Reverting balance and reloading from storage...');
      await loadWalletBalance();
      return false;
    }
  };

  const deductFunds = async (amount: number, description: string): Promise<boolean> => {
    if (!user || amount <= 0) return false;

    if (balance < amount) {
      Alert.alert(
        'Insufficient Balance',
        `You need $${amount.toFixed(2)} but only have $${balance.toFixed(2)} in your wallet. Please top up your wallet or use a different payment method.`
      );
      return false;
    }

    try {
      const newBalance = balance - amount;
      setBalance(newBalance);
      await saveBalanceToStorage(newBalance);
      
      console.log(`Deducted $${amount} from wallet for: ${description}. New balance: $${newBalance}`);
      return true;
    } catch (error) {
      console.error('Error deducting funds:', error);
      // Revert balance on error
      await loadWalletBalance();
      return false;
    }
  };

  const refreshBalance = async () => {
    console.log('Refreshing wallet balance...');
    await loadWalletBalance();
  };

  const getBalance = () => {
    return balance;
  };

  const value = {
    balance,
    loading,
    addFunds,
    deductFunds,
    refreshBalance,
    getBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}