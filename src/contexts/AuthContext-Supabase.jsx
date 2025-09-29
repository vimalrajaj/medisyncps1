import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [abhaToken, setAbhaToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Generate ABHA token for FHIR API access
  const generateAbhaToken = (profile) => {
    const tokenPayload = {
      sub: profile.user_id || user?.id,
      abha_id: profile.abha_id || '14-1234-5678-9012',
      abha_address: profile.abha_address || 'demo.user@sbx',
      roles: profile.roles || ['healthcare_provider', 'ayush_practitioner'],
      scope: 'terminology.read terminology.write bundle.create',
      hpr_id: profile.hpr_id || 'HPR-12345',
      facility_id: profile.facility_id || 'FAC-67890',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    }
    
    // Create mock ABHA token (in production, get from ABHA service)
    const mockToken = btoa(JSON.stringify(tokenPayload))
    setAbhaToken(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockToken}.signature`)
  }

  // Isolated async operations - never called from auth callbacks
  const profileOperations = {
    async load(userId) {
      if (!userId) return
      setProfileLoading(true)
      try {
        const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()
        if (!error && data) {
          setUserProfile(data)
          generateAbhaToken(data)
        }
      } catch (error) {
        console.error('Profile load error:', error)
      } finally {
        setProfileLoading(false)
      }
    },

    clear() {
      setUserProfile(null)
      setAbhaToken(null)
      setProfileLoading(false)
    }
  }

  // Auth state handlers - PROTECTED from async modification
  const authStateHandlers = {
    // This handler MUST remain synchronous - Supabase requirement
    onChange: (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        profileOperations?.load(session?.user?.id) // Fire-and-forget
      } else {
        profileOperations?.clear()
      }
    }
  }

  useEffect(() => {
    // Initial session check
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
      authStateHandlers?.onChange(null, session)
    })

    // CRITICAL: This must remain synchronous
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      authStateHandlers?.onChange
    )

    return () => subscription?.unsubscribe()
  }, [])

  // Auth methods
  const signIn = async (email, password) => {
    try {
      console.log('🔐 AuthContext: Starting signIn process');
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password?.length);
      console.log('🏗️ Supabase client status:', {
        client: !!supabase,
        auth: !!supabase?.auth,
        supabaseUrl: import.meta.env?.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env?.VITE_SUPABASE_ANON_KEY
      });
      
      if (!supabase?.auth) {
        throw new Error('Supabase client not properly initialized');
      }
      
      console.log('📞 Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase?.auth?.signInWithPassword({ 
        email: email.trim(), 
        password: password 
      });
      
      console.log('📥 Supabase response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        userEmail: data?.user?.email,
        error: error ? {
          message: error.message,
          code: error.code,
          status: error.status
        } : null
      });
      
      if (error) {
        console.error('❌ Supabase authentication error:', error);
      } else if (data?.user) {
        console.log('✅ Authentication successful for:', data.user.email);
      }
      
      return { data, error }
    } catch (error) {
      console.error('💥 Supabase signIn exception:', error)
      
      // Return more descriptive error
      if (error?.message?.includes('fetch')) {
        return { error: { message: 'Network connection failed. Unable to reach authentication server.' } }
      } else if (error?.message?.includes('CORS')) {
        return { error: { message: 'Cross-origin request blocked. Server configuration issue.' } }
      } else {
        return { error: { message: error?.message || 'Authentication service unavailable.' } }
      }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase?.auth?.signOut()
      if (!error) {
        setUser(null)
        profileOperations?.clear()
      }
      return { error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: { message: 'No user logged in' } }
    
    try {
      const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', user?.id)?.select()?.single()
      if (!error) setUserProfile(data)
      return { data, error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const value = {
    user,
    userProfile,
    abhaToken,
    loading,
    profileLoading,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    isAbhaAuthenticated: !!abhaToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
