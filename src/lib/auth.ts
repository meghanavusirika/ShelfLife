const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
  googleId?: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface GoogleAuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  token?: string;
}

class AuthService {
  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async signInWithGoogle(googleToken: string): Promise<GoogleAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: googleToken }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('googleToken', data.token);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, message: 'Google authentication failed. Please try again.' };
    }
  }

  async signOut(): Promise<void> {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('googleToken');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  getGoogleToken(): string | null {
    return localStorage.getItem('googleToken');
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Initialize Google Sign-In
  async initializeGoogleSignIn(): Promise<boolean> {
    try {
      // Check if Google API is available
      if (typeof window !== 'undefined' && window.google) {
        return true;
      }
      
      // Load Google API if not already loaded
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (window.google) {
            window.google.accounts.id.initialize({
              client_id: process.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
              callback: this.handleGoogleCredentialResponse.bind(this),
            });
            resolve(true);
          } else {
            resolve(false);
          }
        };
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
      return false;
    }
  }

  // Handle Google credential response
  private async handleGoogleCredentialResponse(response: any) {
    try {
      const result = await this.signInWithGoogle(response.credential);
      if (result.success) {
        // Trigger a custom event to notify the app
        window.dispatchEvent(new CustomEvent('googleSignInSuccess', { detail: result }));
      } else {
        window.dispatchEvent(new CustomEvent('googleSignInError', { detail: result }));
      }
    } catch (error) {
      console.error('Error handling Google credential:', error);
      window.dispatchEvent(new CustomEvent('googleSignInError', { detail: { message: 'Authentication failed' } }));
    }
  }

  // Render Google Sign-In button
  renderGoogleSignInButton(elementId: string) {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        { 
          theme: 'outline', 
          size: 'large',
          width: '100%',
          text: 'continue_with'
        }
      );
    }
  }
}

// Extend Window interface for Google API
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const authService = new AuthService(); 