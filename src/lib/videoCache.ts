interface VideoCacheEntry {
  url: string;
  timestamp: number;
  status: 'working' | 'broken' | 'youtube';
  expiresAt: number;
}

interface VideoCache {
  [key: string]: VideoCacheEntry;
}

const CACHE_KEY = 'msk_video_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHE_SIZE = 1000; // Maximum number of cached entries

class VideoCacheManager {
  private cache: VideoCache = {};
  private isInitialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsedCache = JSON.parse(stored);
        this.cache = this.cleanExpiredEntries(parsedCache);
        this.isInitialized = true;
      }
    } catch (error) {
      console.warn('Failed to load video cache from localStorage:', error);
      this.cache = {};
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      
      // Clean expired entries before saving
      this.cache = this.cleanExpiredEntries(this.cache);
      
      // Limit cache size
      if (Object.keys(this.cache).length > MAX_CACHE_SIZE) {
        this.cache = this.trimCache();
      }
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save video cache to localStorage:', error);
    }
  }

  private cleanExpiredEntries(cache: VideoCache): VideoCache {
    const now = Date.now();
    const cleaned: VideoCache = {};
    
    for (const [key, entry] of Object.entries(cache)) {
      if (entry.expiresAt > now) {
        cleaned[key] = entry;
      }
    }
    
    return cleaned;
  }

  private trimCache(): VideoCache {
    const entries = Object.entries(this.cache);
    // Sort by timestamp (oldest first) and keep only the most recent entries
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const trimmed: VideoCache = {};
    const keepCount = Math.floor(MAX_CACHE_SIZE * 0.8); // Keep 80% of max size
    
    for (let i = entries.length - keepCount; i < entries.length; i++) {
      if (entries[i]) {
        trimmed[entries[i][0]] = entries[i][1];
      }
    }
    
    return trimmed;
  }

  private generateCacheKey(originalUrl: string): string {
    // Create a consistent key from the URL
    return btoa(originalUrl).replace(/[^a-zA-Z0-9]/g, '');
  }

  get(originalUrl: string): VideoCacheEntry | null {
    if (!this.isInitialized) {
      this.loadFromStorage();
    }
    
    const key = this.generateCacheKey(originalUrl);
    const entry = this.cache[key];
    
    if (entry && entry.expiresAt > Date.now()) {
      return entry;
    }
    
    return null;
  }

  set(originalUrl: string, status: 'working' | 'broken' | 'youtube', proxyUrl?: string): void {
    const key = this.generateCacheKey(originalUrl);
    const now = Date.now();
    
    this.cache[key] = {
      url: proxyUrl || originalUrl,
      timestamp: now,
      status,
      expiresAt: now + CACHE_DURATION
    };
    
    this.saveToStorage();
  }

  // Get cached URL or return original URL
  getCachedUrl(originalUrl: string): string {
    const cached = this.get(originalUrl);
    if (cached && cached.status === 'working') {
      return cached.url;
    }
    return originalUrl;
  }

  // Check if URL is known to be broken
  isBroken(originalUrl: string): boolean {
    const cached = this.get(originalUrl);
    return cached?.status === 'broken';
  }

  // Check if URL should use YouTube fallback
  shouldUseYouTube(originalUrl: string): boolean {
    const cached = this.get(originalUrl);
    return cached?.status === 'youtube';
  }

  // Clear all cache
  clear(): void {
    this.cache = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  // Get cache statistics
  getStats(): { total: number; working: number; broken: number; youtube: number; expired: number } {
    const now = Date.now();
    let total = 0;
    let working = 0;
    let broken = 0;
    let youtube = 0;
    let expired = 0;

    for (const entry of Object.values(this.cache)) {
      total++;
      if (entry.expiresAt <= now) {
        expired++;
      } else {
        switch (entry.status) {
          case 'working':
            working++;
            break;
          case 'broken':
            broken++;
            break;
          case 'youtube':
            youtube++;
            break;
        }
      }
    }

    return { total, working, broken, youtube, expired };
  }

  // Preload cache for a list of URLs with batch processing
  async preloadCache(urls: string[]): Promise<void> {
    const BATCH_SIZE = 10; // Process 10 URLs at a time to avoid overwhelming the server
    const results = { success: 0, failed: 0, skipped: 0 };
    
    console.log(`🔄 Starting batch preload of ${urls.length} URLs...`);
    
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(urls.length / BATCH_SIZE)} (${batch.length} URLs)`);
      
      const promises = batch.map(async (url) => {
        if (this.get(url)) {
          results.skipped++;
          return; // Already cached
        }
        
        try {
          const response = await fetch(`/api/proxy/video?url=${encodeURIComponent(url)}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (response.ok) {
            this.set(url, 'working', `/api/proxy/video?url=${encodeURIComponent(url)}`);
            results.success++;
          } else {
            this.set(url, 'broken');
            results.failed++;
          }
        } catch (error) {
          this.set(url, 'broken');
          results.failed++;
        }
      });

      await Promise.allSettled(promises);
      
      // Small delay between batches to be nice to the server
      if (i + BATCH_SIZE < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Preload complete: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`);
  }
}

// Export singleton instance
export const videoCache = new VideoCacheManager();

// Export types for use in components
export type { VideoCacheEntry, VideoCache };
