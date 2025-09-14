'use client';

import { useState } from 'react';
import { useVideoCache } from '@/hooks/useVideoCache';
import { TrashIcon, ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface VideoCacheManagerProps {
  onPreloadComplete?: () => void;
  allVideoUrls?: string[];
}

export default function VideoCacheManager({ onPreloadComplete, allVideoUrls }: VideoCacheManagerProps) {
  const { cacheStats, clearCache, isPreloading, preloadVideos } = useVideoCache();
  const [showDetails, setShowDetails] = useState(false);

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear the video cache? This will require re-fetching all video URLs.')) {
      clearCache();
    }
  };

  const handlePreloadAll = async () => {
    if (allVideoUrls && allVideoUrls.length > 0) {
      if (confirm(`This will preload ${allVideoUrls.length} video URLs. This may take several minutes. Continue?`)) {
        await preloadVideos(allVideoUrls);
        onPreloadComplete?.();
      }
    }
  };

  const getCacheHealthColor = () => {
    const { total, working } = cacheStats;
    if (total === 0) return 'text-gray-500';
    const healthRatio = working / total;
    if (healthRatio >= 0.8) return 'text-green-600';
    if (healthRatio >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCacheHealthText = () => {
    const { total, working } = cacheStats;
    if (total === 0) return 'No cache data';
    const healthRatio = working / total;
    if (healthRatio >= 0.8) return 'Excellent';
    if (healthRatio >= 0.6) return 'Good';
    return 'Needs attention';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Video Cache Status</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{cacheStats.total}</div>
          <div className="text-sm text-gray-500">Total Cached</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{cacheStats.working}</div>
          <div className="text-sm text-gray-500">Working</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{cacheStats.broken}</div>
          <div className="text-sm text-gray-500">Broken</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{cacheStats.youtube}</div>
          <div className="text-sm text-gray-500">YouTube</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Cache Health:</span>
          <span className={`text-sm font-medium ${getCacheHealthColor()}`}>
            {getCacheHealthText()}
          </span>
        </div>
        {isPreloading && (
          <div className="flex items-center space-x-2 text-blue-600">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            <span className="text-sm">Preloading...</span>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cache Details</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cache expires after 24 hours</li>
                <li>• Maximum 1,000 entries</li>
                <li>• Automatically cleaned on load</li>
                <li>• Stored in browser localStorage</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Performance Benefits</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Faster page load times</li>
                <li>• Reduced server requests</li>
                <li>• Better user experience</li>
                <li>• Offline video availability</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleClearCache}
          disabled={cacheStats.total === 0}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrashIcon className="h-4 w-4" />
          <span>Clear Cache</span>
        </button>
        
        {allVideoUrls && allVideoUrls.length > 0 && (
          <button
            onClick={handlePreloadAll}
            disabled={isPreloading}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isPreloading ? 'animate-spin' : ''}`} />
            <span>Preload All ({allVideoUrls.length})</span>
          </button>
        )}
        
        {cacheStats.expired > 0 && (
          <div className="flex items-center space-x-2 px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded-md">
            <span>⚠️ {cacheStats.expired} expired entries</span>
          </div>
        )}
      </div>
    </div>
  );
}
