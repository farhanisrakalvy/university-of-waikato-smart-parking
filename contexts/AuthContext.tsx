import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Starting sign out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthContext: Sign out error:', error);
        throw error;
      }
      
      console.log('AuthContext: Sign out successful');
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      
      return { error: null };
    } catch (error) {
      console.error('AuthContext: Sign out failed:', error);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
