import { TX_HISTORY_CACHE_PREFIX } from '@/base/constant';
import { createHash } from 'crypto';
import { Cache } from 'cache-manager';
import { redisClient } from './redis.util';

/**
 * Generate transaction history cache key
 */
export function generateTxHistoryCacheKey(walletId: string, dto: any): string {
  const hash = createHash('md5')
    .update(JSON.stringify(dto))
    .digest('hex');
  return `${TX_HISTORY_CACHE_PREFIX(walletId)}:${hash}`;
}

export function generateCacheKey(userId: string): string {
  return `wallet:${userId}`
}

export async function invalidateCache(userId: string, cacheManager: Cache): Promise<void> {
  const cacheKey = generateCacheKey(userId);

  await cacheManager.del(cacheKey);
}


/**
 * Invalidates all transaction history cache keys for a given wallet
 */
export const invalidateCacheByPattern = async (walletId: string): Promise<void> => {
  const pattern = `${TX_HISTORY_CACHE_PREFIX(walletId)}:*`;
  const stream = redisClient.scanStream({ match: pattern });

  for await (const keys of stream) {
    if (keys.length) {
      await redisClient.del(...keys);
    }
  }
};

