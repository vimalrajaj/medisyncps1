/**
 * Supabase Connection Debug Component
 * Shows real-time connection status and helps diagnose issues
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SupabaseConnectionDebug = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'checking',
    message: 'Checking connection...',
    details: null,
    error: null
  });

  const checkConnection = async () => {
    setConnectionStatus({
      status: 'checking',
      message: 'Testing Supabase connection...',
      details: null,
      error: null
    });

    try {
      // Check environment variables
      const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

      console.log('🔍 Environment Check:', {
        supabaseUrl,
        hasKey: !!supabaseKey,
        keyPreview: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING'
      });

      if (!supabaseUrl || !supabaseKey) {
        setConnectionStatus({
          status: 'error',
          message: 'Missing environment variables',
          details: {
            supabaseUrl: supabaseUrl || 'MISSING',
            supabaseKey: supabaseKey ? 'PRESENT' : 'MISSING'
          },
          error: 'Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
        });
        return;
      }

      // Test connection with getSession
      console.log('🔍 Testing Supabase connection...');
      const { data, error } = await supabase?.auth?.getSession();

      if (error) {
        console.error('❌ Connection failed:', error);
        setConnectionStatus({
          status: 'error',
          message: 'Connection failed',
          details: {
            errorCode: error.code,
            errorMessage: error.message,
            supabaseUrl,
            timestamp: new Date().toISOString()
          },
          error: error.message
        });
      } else {
        console.log('✅ Connection successful:', data);
        setConnectionStatus({
          status: 'success',
          message: 'Connection successful',
          details: {
            hasSession: !!data?.session,
            supabaseUrl,
            timestamp: new Date().toISOString()
          },
          error: null
        });
      }
    } catch (error) {
      console.error('❌ Connection test exception:', error);
      setConnectionStatus({
        status: 'error',
        message: 'Connection test failed',
        details: {
          errorType: error.name,
          errorMessage: error.message,
          stack: error.stack
        },
        error: `${error.name}: ${error.message}`
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'checking':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className="font-medium text-gray-900">Supabase Connection</h3>
        </div>
        <button
          onClick={checkConnection}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Retry
        </button>
      </div>

      <p className="text-sm text-gray-700 mb-2">{connectionStatus.message}</p>

      {connectionStatus.error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
          <strong>Error:</strong> {connectionStatus.error}
        </div>
      )}

      {connectionStatus.details && (
        <div className="text-xs text-gray-600">
          <details className="cursor-pointer">
            <summary className="font-medium mb-1">Connection Details</summary>
            <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(connectionStatus.details, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {connectionStatus.status === 'error' && (
        <div className="mt-3 text-xs text-gray-600">
          <p><strong>Troubleshooting:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Check your internet connection</li>
            <li>Verify .env file contains correct Supabase credentials</li>
            <li>Ensure Supabase project is active and accessible</li>
            <li>Check browser console for additional error details</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SupabaseConnectionDebug;
