import { SWRConfiguration } from 'swr'

// Global SWR configuration for instant navigation
export const swrConfig: SWRConfiguration = {
  // Cache configuration - use a stable Map instance for better performance
  provider: () => new Map(),
  
  // CRITICAL: Keep showing old data while fetching new data
  // This makes navigation feel instant by showing cached data immediately
  keepPreviousData: true,
  
  // Don't revalidate when window regains focus (we have auto-refresh intervals)
  revalidateOnFocus: false,
  
  // Don't revalidate on reconnect (we have auto-refresh intervals)
  revalidateOnReconnect: false,
  
  // Dedupe requests within 2 seconds to prevent duplicate API calls
  dedupingInterval: 2000,
  
  // Throttle focus revalidation
  focusThrottleInterval: 10000,
  
  // Error handling
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
  
  // OPTIMIZATION: Only revalidate stale data in background, never block UI
  revalidateIfStale: true,
  
  // Compare function to prevent unnecessary re-renders
  compare: (a, b) => {
    // Deep equality check for objects
    return JSON.stringify(a) === JSON.stringify(b)
  },
  
  // Suspense mode - false for better UX with loading states
  suspense: false,
  
  // Load fresh data on mount if cache is empty
  revalidateOnMount: undefined, // Let individual hooks decide
}
