import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    abhaId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(true);
  const [authStep, setAuthStep] = useState('login'); // 'login', 'authenticating', 'generating-abha', 'complete'

  const { signIn, user, abhaToken, isAbhaAuthenticated, profileLoading } = useAuth();

  // Monitor authentication progress
  useEffect(() => {
    if (loading) {
      setAuthStep('authenticating');
    } else if (user && profileLoading) {
      setAuthStep('generating-abha');
    } else if (user && abhaToken) {
      setAuthStep('complete');
    } else {
      setAuthStep('login');
    }
  }, [loading, user, abhaToken, profileLoading]);

  // Redirect to clinical diagnosis entry when authentication is complete
  useEffect(() => {
    if (isAbhaAuthenticated && authStep === 'complete') {
      console.log('🚀 ABHA authentication complete, redirecting to clinical diagnosis entry...');
      setTimeout(() => {
        navigate('/clinical-diagnosis-entry');
      }, 1500); // Small delay to show success state
    }
  }, [isAbhaAuthenticated, authStep, navigate]);

  // Demo ABHA credentials
  const demoCredentials = [
    {
      label: 'ABHA Admin',
      email: 'admin@ayush.gov.in',
      password: 'Admin@123',
      role: 'admin',
      abha_id: '14-1234-5678-9012',
      description: 'Administrative Officer - Full Access'
    },
    {
      label: 'ABHA Doctor',
      email: 'doctor@ayush.clinic',
      password: 'Doctor@123',
      role: 'doctor',
      abha_id: '14-2345-6789-0123',
      description: 'Clinical Practitioner - FHIR Access'
    },
    {
      label: 'ABHA Viewer',
      email: 'viewer@ayush.org',
      password: 'Viewer@123',
      role: 'viewer',
      abha_id: '14-3456-7890-1234',
      description: 'Research Viewer - Read Only'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    console.log('🚀 Form submitted with:', formData);
    setLoading(true);
    setError('');

    try {
      console.log('📞 Calling signIn with ABHA ID:', {
        abhaId: formData?.abhaId
      });
      
      const { data, error } = await signIn(formData?.abhaId);
      
      console.log('📥 SignIn result:', { 
        data: data ? {
          user: data.user ? { id: data.user.id, email: data.user.email } : null,
          session: data.session ? 'present' : null
        } : null,
        error: error ? {
          message: error.message,
          code: error.code || 'no-code',
          status: error.status || 'no-status'
        } : null
      });
      
      if (error) {
        console.error('❌ Authentication error:', error);
        setError(error?.message || 'Invalid ABHA ID. Please check the format.');
        return;
      }

      if (data?.user) {
        console.log('✅ Login successful! User:', data.user.email);
        // Success - AuthContext will handle the redirect and ABHA token generation
      } else {
        console.warn('⚠️ Login returned no user data');
        setError('Login succeeded but no user data received. Please try again.');
      }

    } catch (error) {
      console.error('💥 Login exception:', error);
      if (error?.message?.includes('fetch')) {
        setError('Network error: Unable to connect to authentication service.');
      } else if (error?.message?.includes('CORS')) {
        setError('Network error: Cross-origin request blocked.');
      } else {
        setError(`System error: ${error?.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">ABHA Login</h2>
          </div>
          <p className="text-gray-600">Access AYUSH Terminology Service</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* ABHA Demo Codes */}
        {showDemoCredentials && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">Demo ABHA Codes</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoCredentials(false)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Hide
              </button>
            </div>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Admin Access</span>
                  <span className="text-xs px-2 py-1 bg-green-100 rounded text-green-800">admin</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-mono text-blue-900">14-1234-5678-9012</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ abhaId: '14-1234-5678-9012' });
                    }}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                  >
                    Use This ID
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Doctor Access</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 rounded text-blue-800">doctor</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-mono text-blue-900">14-2345-6789-0123</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ abhaId: '14-2345-6789-0123' });
                    }}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                  >
                    Use This ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showDemoCredentials && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(true)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <Shield className="h-4 w-4" />
              <span>Show Demo ABHA Codes</span>
            </button>
          </div>
        )}

        {/* ABHA ID Field */}
        <div className="mb-6">
          <label htmlFor="abhaId" className="block text-sm font-medium text-gray-700 mb-2">
            ABHA ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Shield className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="abhaId"
              name="abhaId"
              type="text"
              value={formData?.abhaId || ''}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your ABHA ID (e.g., 14-1234-5678-9012)"
              pattern="[0-9]{2}-[0-9]{4}-[0-9]{4}-[0-9]{4}"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Format: XX-XXXX-XXXX-XXXX</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || authStep !== 'login'}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {authStep === 'authenticating' ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Authenticating...</span>
            </div>
          ) : authStep === 'generating-abha' ? (
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-4 w-4 animate-pulse" />
              <span>Generating ABHA Token...</span>
            </div>
          ) : authStep === 'complete' ? (
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Redirecting to FHIR Interface...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Login with ABHA</span>
            </div>
          )}
        </button>

        {/* Success Message */}
        {authStep === 'complete' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">ABHA Authentication Successful!</p>
                <p className="text-xs text-green-700">Redirecting to Clinical Diagnosis Entry with full FHIR R4 access...</p>
              </div>
            </div>
          </div>
        )}

        {/* ABHA Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need ABHA registration?{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Get ABHA ID
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;