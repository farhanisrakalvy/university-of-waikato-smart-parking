/**
 * @fileoverview Authentication Context Provider for University of Waikato Smart Parking System
 * 
 * This module provides centralized authentication state management using Supabase Auth.
 * It handles user registration, login, logout, and session persistence across the application.
 * 
 * @version 1.0.0
 * @author University of Waikato Development Team
 * @since 2024-10-01
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Authentication context type definition
 * 
 * Defines the structure of the authentication context, providing
 * user session management and authentication methods.
 * 
 * @interface AuthContextType
 */
interface AuthContextType {
  /** Current user session object, null if not authenticated */
  session: Session | null;
  
  /** Current authenticated user object, null if not authenticated */
  user: User | null;
  
  /** Loading state indicator for authentication operations */
  loading: boolean;
  
  /** 
   * User registration function
   * @param email - User's email address
   * @param password - User's password (minimum 6 characters)
   * @param fullName - User's full name for profile creation
   * @returns Promise resolving to authentication result
   */
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  
  /**
   * User login function
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to authentication result
   */
  signIn: (email: string, password: string) => Promise<any>;
  
  /**
   * User logout function
   * @returns Promise resolving to logout result
   */
  signOut: () => Promise<any>;
}

/**
 * Authentication context instance
 * 
 * React context for sharing authentication state across the application.
 * Should only be accessed through the useAuth hook for type safety.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * 
 * Provides authentication context to child components. Manages user session state,
 * handles authentication state changes, and provides authentication methods.
 * 
 * Features:
 * - Automatic session recovery on app startup
 * - Real-time authentication state updates
 * - Centralized error handling for auth operations
 * - User profile creation on registration
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with auth context
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Authentication state management
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Initialize authentication state and set up session monitoring
   * 
   * This effect runs once on component mount to:
   * 1. Retrieve existing session from Supabase
   * 2. Set up real-time authentication state listener
   * 3. Update local state when authentication changes occur
   */
  useEffect(() => {
    /**
     * Initialize session state on component mount
     */
    const initializeAuth = async (): Promise<void> => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Error getting initial session:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('AuthContext: Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    /**
     * Set up real-time authentication state listener
     * 
     * Listens for authentication events (login, logout, token refresh)
     * and updates the local state accordingly.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed -', event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * User Registration Function
   * 
   * Handles new user registration with comprehensive error handling and validation.
   * Creates both authentication account and user profile in the database.
   * 
   * Process:
   * 1. Normalize and validate email input
   * 2. Check for existing user accounts
   * 3. Create Supabase Auth account
   * 4. Create user profile in database
   * 5. Handle various error scenarios
   * 
   * @param {string} email - User's email address (will be normalized)
   * @param {string} password - User's password (minimum 6 characters required)
   * @param {string} fullName - User's full name for profile creation
   * @returns {Promise<{data: any, error: any}>} Registration result with user data or error
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // First check if user already exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)
        .single();

      if (existingUser) {
        return {
          data: null,
          error: {
            message:
              'An account with this email already exists. Please sign in instead.',
          },
        };
      }

      // Attempt to sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        // Handle specific Supabase auth errors
        if (
          error.message.includes('already registered') ||
          error.message.includes('already exists')
        ) {
          return {
            data: null,
            error: {
              message:
                'An account with this email already exists. Please sign in instead.',
            },
          };
        }
        if (error.message.includes('Invalid email')) {
          return {
            data: null,
            error: { message: 'Please enter a valid email address.' },
          };
        }
        if (error.message.includes('Password')) {
          return {
            data: null,
            error: { message: 'Password must be at least 6 characters long.' },
          };
        }
        return { data: null, error };
      }

      if (data.user) {
        // Use the safe user profile creation function
        const { data: profileResult, error: profileError } = await supabase.rpc(
          'create_user_profile',
          {
            user_id: data.user.id,
            user_email: normalizedEmail,
            user_full_name: fullName.trim(),
          }
        );

        if (profileError || !profileResult?.success) {
          console.error(
            'Profile creation failed:',
            profileError || profileResult?.error
          );
          return {
            data: null,
            error: {
              message:
                profileResult?.error ||
                'Account creation failed. Please try again.',
            },
          };
        }
      }

      return { data, error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return {
        data: null,
        error: { message: 'An unexpected error occurred. Please try again.' },
      };
    }
  };

  /**
   * User Login Function
   * 
   * Authenticates user with email and password using Supabase Auth.
   * Automatically normalizes email input for consistency.
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<{data: any, error: any}>} Login result with session data or error
   */
  const signIn = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      
      console.log('AuthContext: Sign in attempt -', result.error ? 'failed' : 'successful');
      return result;
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      return { data: null, error };
    }
  };

  /**
   * User Logout Function
   * 
   * Signs out the current user and clears all authentication state.
   * Provides immediate local state cleanup for better user experience.
   * 
   * Process:
   * 1. Call Supabase auth sign out
   * 2. Clear local session and user state
   * 3. Handle any logout errors gracefully
   * 
   * @returns {Promise<{error: any}>} Logout result with potential error information
   */
  const signOut = async () => {
    try {
      console.log('AuthContext: Starting sign out process...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthContext: Sign out error:', error);
        throw error;
      }
      
      console.log('AuthContext: Sign out successful');
      
      // Clear local state immediately for better UX
      setSession(null);
      setUser(null);
      
      return { error: null };
    } catch (error) {
      console.error('AuthContext: Sign out failed:', error);
      
      // Still clear local state even if server-side logout fails
      setSession(null);
      setUser(null);
      
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Authentication Hook
 * 
 * Custom React hook for accessing authentication context.
 * Provides type-safe access to authentication state and methods.
 * 
 * Must be used within an AuthProvider component tree.
 * 
 * @returns {AuthContextType} Authentication context value with state and methods
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * function LoginComponent() {
 *   const { user, signIn, loading } = useAuth();
 *   
 *   if (loading) return <LoadingSpinner />;
 *   if (user) return <WelcomeUser user={user} />;
 *   
 *   return <LoginForm onSubmit={signIn} />;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>.'
    );
  }
  
  return context;
}
