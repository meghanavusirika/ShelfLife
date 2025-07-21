import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, type User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  initializeGoogleAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Set up Google authentication event listeners
    const handleGoogleSignInSuccess = (event: CustomEvent) => {
      if (event.detail.user) {
        setUser(event.detail.user);
        toast({
          title: "Welcome! 🎉",
          description: "Successfully signed in with Google."
        });
      }
    };

    const handleGoogleSignInError = (event: CustomEvent) => {
      toast({
        title: "Google Sign-In Error",
        description: event.detail.message || "Failed to sign in with Google.",
        variant: "destructive"
      });
    };

    window.addEventListener('googleSignInSuccess', handleGoogleSignInSuccess as EventListener);
    window.addEventListener('googleSignInError', handleGoogleSignInError as EventListener);

    return () => {
      window.removeEventListener('googleSignInSuccess', handleGoogleSignInSuccess as EventListener);
      window.removeEventListener('googleSignInError', handleGoogleSignInError as EventListener);
    };
  }, [toast]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const response = await authService.signIn(email, password);
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        throw new Error(response.message || 'Sign in failed');
      }
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      const response = await authService.signUp(email, password, name);
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        throw new Error(response.message || 'Sign up failed');
      }
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const isInitialized = await initializeGoogleAuth();
      if (!isInitialized) {
        throw new Error('Failed to initialize Google authentication');
      }
      
      // Trigger Google Sign-In prompt
      if (window.google && window.google.accounts) {
        window.google.accounts.id.prompt();
      } else {
        throw new Error('Google authentication not available');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const initializeGoogleAuth = async (): Promise<boolean> => {
    try {
      return await authService.initializeGoogleSignIn();
    } catch (error) {
      console.error('Error initializing Google auth:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    initializeGoogleAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 