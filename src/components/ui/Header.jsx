import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../contexts/AuthContext';


const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAbhaAuthenticated, abhaToken } = useAuth();

  const navigationItems = [
    {
      label: 'Clinical',
      path: '/clinical-diagnosis-entry',
      icon: 'Stethoscope',
      description: 'Diagnosis Entry'
    },
    {
      label: 'Administration',
      path: '/admin-dashboard',
      icon: 'Settings',
      description: 'System Management'
    },
    {
      label: 'API Management',
      path: '/api-client-management',
      icon: 'Database',
      description: 'Client Management'
    },
    {
      label: 'Developer',
      path: '/developer-portal',
      icon: 'Code',
      description: 'API Portal'
    }
  ];

  const moreItems = [
    {
      label: 'Terminology Upload',
      path: '/terminology-upload',
      icon: 'Upload',
      description: 'Data Management'
    }
  ];

  const isActivePath = (path) => {
    return location?.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-100 bg-surface border-b border-border clinical-shadow">
      <div className="w-full">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <Link to="/admin-dashboard" className="flex items-center space-x-3 clinical-transition clinical-hover:opacity-80">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Icon name="Heart" size={24} color="white" strokeWidth={2} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-text-primary">AYUSH</h1>
                <p className="text-xs text-text-secondary -mt-1">Terminology Service</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems?.map((item) => (
              <Link
                key={item?.path}
                to={item?.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium clinical-transition ${
                  isActivePath(item?.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                }`}
              >
                <Icon name={item?.icon} size={16} />
                <span>{item?.label}</span>
              </Link>
            ))}
            
            {/* More Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-muted clinical-transition">
                <Icon name="MoreHorizontal" size={16} />
                <span>More</span>
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg clinical-shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible clinical-transition z-200">
                <div className="p-2">
                  {moreItems?.map((item) => (
                    <Link
                      key={item?.path}
                      to={item?.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm clinical-transition ${
                        isActivePath(item?.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-popover-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon name={item?.icon} size={16} />
                      <div>
                        <div className="font-medium">{item?.label}</div>
                        <div className="text-xs text-text-secondary">{item?.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* FHIR R4 Status Indicator */}
          {isAbhaAuthenticated && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
              <Icon name="Shield" size={14} className="text-green-600" />
              <span className="text-xs font-medium text-green-800">FHIR R4 Ready</span>
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg text-text-secondary hover:text-text-primary hover:bg-muted clinical-transition">
              <Icon name="Bell" size={20} />
            </button>

            {/* User Profile */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-muted clinical-transition">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Icon name="User" size={16} color="white" />
                </div>
                <span className="hidden md:block text-sm font-medium">Dr. Admin</span>
                <Icon name="ChevronDown" size={16} className="hidden md:block" />
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg clinical-shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible clinical-transition z-200">
                <div className="p-2">
                  <Link
                    to="/login-authentication"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-popover-foreground hover:bg-muted clinical-transition"
                  >
                    <Icon name="LogOut" size={16} />
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-text-secondary hover:text-text-primary hover:bg-muted clinical-transition"
            >
              <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-surface">
            <nav className="p-4 space-y-2">
              {[...navigationItems, ...moreItems]?.map((item) => (
                <Link
                  key={item?.path}
                  to={item?.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg clinical-transition ${
                    isActivePath(item?.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                  }`}
                >
                  <Icon name={item?.icon} size={20} />
                  <div>
                    <div className="font-medium">{item?.label}</div>
                    <div className="text-xs opacity-75">{item?.description}</div>
                  </div>
                </Link>
              ))}
              
              <div className="pt-2 mt-4 border-t border-border">
                <Link
                  to="/login-authentication"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-muted clinical-transition"
                >
                  <Icon name="LogOut" size={20} />
                  <span className="font-medium">Sign Out</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;