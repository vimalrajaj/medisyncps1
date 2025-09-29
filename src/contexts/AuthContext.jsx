/**
 * Simplified Auth Context with Mock ABHA Authentication
 * No Supabase dependency - pure ABHA simulation
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockAbhaAuth } from '../services/mockAbhaAuth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [abhaToken, setAbhaToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data } = await mockAbhaAuth.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
        setAbhaToken(data.session.access_token);
        console.log('✅ Session restored for:', data.session.user.name);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (abhaId) => {
    try {
      setLoading(true);
      console.log('🔐 Starting ABHA authentication...');
      
      const { data, error } = await mockAbhaAuth.signIn(abhaId);
      
      if (error) {
        console.error('❌ ABHA authentication failed:', error);
        return { data: null, error };
      }
      
      if (data?.user && data?.session) {
        console.log('✅ ABHA authentication successful!');
        setUser(data.user);
        setAbhaToken(data.session.access_token);
        
        // Simulate profile loading for visual feedback
        setProfileLoading(true);
        setTimeout(() => {
          setProfileLoading(false);
          console.log('✅ ABHA token ready for FHIR operations');
        }, 1000);
        
        return { data, error: null };
      }
      
      return { data: null, error: { message: 'Authentication failed' } };
      
    } catch (error) {
      console.error('💥 ABHA authentication exception:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Authentication service error' } 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await mockAbhaAuth.signOut();
      setUser(null);
      setAbhaToken(null);
      setProfileLoading(false);
      console.log('🚪 Signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: { message: 'Sign out failed' } };
    }
  };

  // Computed values
  const isAuthenticated = !!user;
  const isAbhaAuthenticated = !!(user && abhaToken);

  const value = {
    // User state
    user,
    abhaToken,
    loading,
    profileLoading,
    
    // Computed state
    isAuthenticated,
    isAbhaAuthenticated,
    
    // Methods
    signIn,
    signOut,
    
    // Legacy compatibility (for existing components)
    userProfile: user // Map user to userProfile for compatibility
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;