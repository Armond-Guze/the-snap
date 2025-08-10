/**
 * Sanity fetch wrapper with logging and error softening
 */

import { client } from './client';

interface FetchOptions {
  cache?: RequestCache;
  next?: {
    revalidate?: number;
    tags?: string[];
  };
}

interface LogContext {
  query: string;
  params?: Record<string, unknown>;
  duration?: number;
  error?: Error;
  resultCount?: number;
}

/**
 * Logs fetch operations for debugging and monitoring
 */
function logFetch(context: LogContext) {
  const { query, params, duration, error, resultCount } = context;
  
  if (error) {
    console.error('🔴 Sanity fetch error:', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      params,
      error: error.message,
      duration,
    });
  } else {
    console.log('🟢 Sanity fetch success:', {
      query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      params,
      resultCount,
      duration: `${duration}ms`,
    });
  }
}

/**
 * Soft error handler that returns fallback values instead of throwing
 */
function handleError<T>(error: Error, fallback: T, context: LogContext): T {
  logFetch({ ...context, error });
  
  // In development, you might want to see the errors
  if (process.env.NODE_ENV === 'development') {
    console.warn('Sanity fetch failed, using fallback:', fallback);
  }
  
  return fallback;
}

/**
 * Enhanced Sanity fetch wrapper
 */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  options: FetchOptions = {},
  fallback: T = [] as T
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await client.fetch<T>(query, params, {
      cache: options.cache || 'force-cache',
      next: options.next,
    });
    
    const duration = Date.now() - startTime;
    const resultCount = Array.isArray(result) ? result.length : result ? 1 : 0;
    
    logFetch({
      query,
      params,
      duration,
      resultCount,
    });
    
    return result || fallback;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return handleError(
      error as Error,
      fallback,
      { query, params, duration }
    );
  }
}

/**
 * Fetch with automatic revalidation for dynamic content
 */
export async function sanityFetchDynamic<T>(
  query: string,
  params: Record<string, unknown> = {},
  revalidateSeconds: number = 60,
  fallback: T = [] as T
): Promise<T> {
  return sanityFetch(query, params, {
    next: { revalidate: revalidateSeconds }
  }, fallback);
}

/**
 * Fetch with specific cache tags for ISR
 */
export async function sanityFetchWithTags<T>(
  query: string,
  params: Record<string, unknown> = {},
  tags: string[] = [],
  fallback: T = [] as T
): Promise<T> {
  return sanityFetch(query, params, {
    next: { tags }
  }, fallback);
}

/**
 * Fetch without caching for real-time data
 */
export async function sanityFetchRealtime<T>(
  query: string,
  params: Record<string, unknown> = {},
  fallback: T = [] as T
): Promise<T> {
  return sanityFetch(query, params, {
    cache: 'no-store'
  }, fallback);
}
