import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Force hardcoded configuration to bypass any environment issues
const supabaseUrl = 'https://rvgsuymucvhzxfkadjyk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3N1eW11Y3Zoenhma2FkanlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMzE2MDgsImV4cCI6MjA2ODgwNzYwOH0.u86ywRYdTm9OkTeDbQj1no18SaqQgyjuv7_k5P_4iew';

// Debug logging
console.log('🔍 Supabase HARDCODED Configuration:');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

// Validate the configuration
if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('5566')) {
  console.error('❌ STILL DETECTING LOCALHOST! URL:', supabaseUrl);
} else {
  console.log('✅ Using cloud Supabase URL');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone_number: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone_number?: string | null;
          created_at?: string;
        };
      };
      parking_spots: {
        Row: {
          id: string;
          title: string;
          description: string;
          latitude: number;
          longitude: number;
          is_available: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          latitude: number;
          longitude: number;
          is_available?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          latitude?: number;
          longitude?: number;
          is_available?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          spot_id: string;
          start_time: string;
          end_time: string;
          status: 'pending' | 'confirmed' | 'completed' | 'canceled';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          spot_id: string;
          start_time: string;
          end_time: string;
          status?: 'pending' | 'confirmed' | 'completed' | 'canceled';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          spot_id?: string;
          start_time?: string;
          end_time?: string;
          status?: 'pending' | 'confirmed' | 'completed' | 'canceled';
          created_at?: string;
        };
      };
    };
  };
};