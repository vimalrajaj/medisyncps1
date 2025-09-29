import React from 'react';
import LoginForm from './components/LoginForm';
import Icon from '../../components/AppIcon';

const LoginAuthentication = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-center min-h-screen">
          
          {/* Left Side - Title and Description */}
          <div className="text-center lg:text-left space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <Icon name="Shield" size={32} className="text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">
                  AYUSH Portal
                </h1>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-700">
                Ministry of AYUSH Terminology Service
              </h2>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Secure FHIR R4 compliant healthcare platform with ABHA authentication for traditional medicine practitioners.
              </p>
            </div>

            {/* Key Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Icon name="CheckCircle" size={20} className="text-green-600" />
                <span className="text-gray-700">FHIR R4 Healthcare Interoperability</span>
              </div>
              <div className="flex items-center space-x-3">
                <Icon name="Shield" size={20} className="text-blue-600" />
                <span className="text-gray-700">ABHA Authentication Integration</span>
              </div>
              <div className="flex items-center space-x-3">
                <Icon name="FileText" size={20} className="text-purple-600" />
                <span className="text-gray-700">NAMASTE-ICD11 Dual Coding</span>
              </div>
              <div className="flex items-center space-x-3">
                <Icon name="Award" size={20} className="text-orange-600" />
                <span className="text-gray-700">Ministry of AYUSH Compliant</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginAuthentication;