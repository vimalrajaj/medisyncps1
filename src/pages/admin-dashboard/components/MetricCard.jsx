import React, { useState, useEffect } from 'react';
import { terminologyService } from '../../../services/terminologyService';
import { apiClientService } from '../../../services/apiClientService';
import { fileUploadService } from '../../../services/fileUploadService';
import * as Icons from 'lucide-react';

const MetricCard = ({ title, value, change, changeType, icon, description, dataSource }) => {
  const [realTimeValue, setRealTimeValue] = useState(value);
  const [loading, setLoading] = useState(false);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchRealData = async () => {
      if (!dataSource) return;

      setLoading(true);
      try {
        let result;
        switch (dataSource) {
          case 'terminology_mappings':
            result = await terminologyService?.getMappingStats();
            if (result?.data) {
              if (title?.includes('Total')) setRealTimeValue(result?.data?.total?.toString() || '0');
              if (title?.includes('Mappings')) setRealTimeValue(result?.data?.total?.toString() || '0');
              if (title?.includes('Accuracy')) setRealTimeValue(`${result?.data?.accuracy}%` || '0%');
            }
            break;
          
          case 'api_clients':
            result = await apiClientService?.getClientStats();
            if (result?.data && title?.includes('Active Users')) {
              setRealTimeValue(result?.data?.active?.toString() || '0');
            }
            break;
          
          case 'api_usage':
            result = await apiClientService?.getApiStats();
            if (result?.data && title?.includes('API Calls')) {
              setRealTimeValue(result?.data?.totalRequests?.toString() || '0');
            }
            break;
          
          case 'file_uploads':
            result = await fileUploadService?.getUploadStats();
            if (result?.data) {
              setRealTimeValue(result?.data?.totalProcessedRecords?.toString() || '0');
            }
            break;
          
          default:
            break;
        }
      } catch (error) {
        console.error('Error fetching metric data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [dataSource, title]);

  const IconComponent = Icons?.[icon] || Icons?.Activity;
  
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-green-600';
    if (changeType === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeBg = () => {
    if (changeType === 'positive') return 'bg-green-50';
    if (changeType === 'negative') return 'bg-red-50';
    return 'bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <IconComponent className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              realTimeValue
            )}
          </div>
          {change && (
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChangeBg()} ${getChangeColor()}`}>
              {change}
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;