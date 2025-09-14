import { useState, useEffect, useCallback } from 'react';
import { videoCache, VideoCacheEntry } from '@/lib/videoCache';

interface UseVideoCacheReturn {
  getCachedUrl: (originalUrl: string) => string;
  isBroken: (originalUrl: string) => boolean;
  shouldUseYouTube: (originalUrl: string) => boolean;
  preloadVideos: (urls: string[]) => Promise<void>;
  clearCache: () => void;
  cacheStats: {
    total: number;
    working: number;
    broken: number;
    youtube: number;
    expired: number;
  };
  isPreloading: boolean;
}

export function useVideoCache(): UseVideoCacheReturn {
  const [cacheStats, setCacheStats] = useState({
    total: 0,
    working: 0,
    broken: 0,
    youtube: 0,
    expired: 0,
  });
  const [isPreloading, setIsPreloading] = useState(false);

  // Update cache stats
  const updateStats = useCallback(() => {
    setCacheStats(videoCache.getStats());
  }, []);

  // Initialize stats
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  const getCachedUrl = useCallback((originalUrl: string): string => {
    return videoCache.getCachedUrl(originalUrl);
  }, []);

  const isBroken = useCallback((originalUrl: string): boolean => {
    return videoCache.isBroken(originalUrl);
  }, []);

  const shouldUseYouTube = useCallback((originalUrl: string): boolean => {
    return videoCache.shouldUseYouTube(originalUrl);
  }, []);

  const preloadVideos = useCallback(async (urls: string[]): Promise<void> => {
    setIsPreloading(true);
    try {
      await videoCache.preloadCache(urls);
      updateStats();
    } catch (error) {
      console.error('Error preloading videos:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [updateStats]);

  const clearCache = useCallback(() => {
    videoCache.clear();
    updateStats();
  }, [updateStats]);

  return {
    getCachedUrl,
    isBroken,
    shouldUseYouTube,
    preloadVideos,
    clearCache,
    cacheStats,
    isPreloading,
  };
}
