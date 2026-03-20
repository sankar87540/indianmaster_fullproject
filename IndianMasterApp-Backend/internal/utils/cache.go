package utils

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	// CacheTTL is the default cache time-to-live (5 minutes)
	CacheTTL = 5 * time.Minute

	// Cache key prefixes
	CacheKeyJobsFeed              = "jobs_feed_page_%d"
	CacheKeyWorkerRecommendations = "worker_recommendations_%s_%d"
	CacheKeySearchWorkers         = "search_workers_%s"
	CacheKeySearchJobs            = "search_jobs_%s"
)

// CacheService provides Redis caching operations
type CacheService struct {
	client *redis.Client
}

// NewCacheService creates a new CacheService instance
func NewCacheService(client *redis.Client) *CacheService {
	return &CacheService{client: client}
}

// Get retrieves a cached value by key and unmarshals it into dest
// Returns (true, nil) if found, (false, nil) if not found, (false, err) on error
func (c *CacheService) Get(ctx context.Context, key string, dest interface{}) (bool, error) {
	if c.client == nil {
		return false, nil
	}

	val, err := c.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("cache get error for key %s: %w", key, err)
	}

	if err := json.Unmarshal(val, dest); err != nil {
		return false, fmt.Errorf("cache unmarshal error for key %s: %w", key, err)
	}

	return true, nil
}

// Set stores a value in cache with the default TTL
func (c *CacheService) Set(ctx context.Context, key string, value interface{}) error {
	return c.SetWithTTL(ctx, key, value, CacheTTL)
}

// SetWithTTL stores a value in cache with a custom TTL
func (c *CacheService) SetWithTTL(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if c.client == nil {
		return nil
	}

	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("cache marshal error for key %s: %w", key, err)
	}

	if err := c.client.Set(ctx, key, data, ttl).Err(); err != nil {
		return fmt.Errorf("cache set error for key %s: %w", key, err)
	}

	return nil
}

// Delete removes a key from cache
func (c *CacheService) Delete(ctx context.Context, key string) error {
	if c.client == nil {
		return nil
	}

	if err := c.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("cache delete error for key %s: %w", key, err)
	}

	return nil
}

// Increment atomically increments a counter key by 1 and sets TTL on the first increment.
// Returns the new count. Returns (0, nil) when Redis is unavailable (no-op).
func (c *CacheService) Increment(ctx context.Context, key string, ttl time.Duration) (int64, error) {
	if c.client == nil {
		return 0, nil
	}

	count, err := c.client.Incr(ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("cache increment error for key %s: %w", key, err)
	}

	// Set TTL only on first increment to preserve the original window boundary.
	if count == 1 {
		if err := c.client.Expire(ctx, key, ttl).Err(); err != nil {
			return count, fmt.Errorf("cache expire error for key %s: %w", key, err)
		}
	}

	return count, nil
}

// DeletePattern removes all keys matching a pattern (e.g., "jobs_feed_*")
func (c *CacheService) DeletePattern(ctx context.Context, pattern string) error {
	if c.client == nil {
		return nil
	}

	var cursor uint64
	for {
		keys, nextCursor, err := c.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return fmt.Errorf("cache scan error for pattern %s: %w", pattern, err)
		}

		if len(keys) > 0 {
			if err := c.client.Del(ctx, keys...).Err(); err != nil {
				return fmt.Errorf("cache delete pattern error for pattern %s: %w", pattern, err)
			}
		}

		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}

	return nil
}

// InvalidateJobsCache removes all jobs feed cache entries
func (c *CacheService) InvalidateJobsCache(ctx context.Context) error {
	return c.DeletePattern(ctx, "jobs_feed_*")
}

// InvalidateWorkerRecommendationsCache removes recommendation cache for a specific worker
func (c *CacheService) InvalidateWorkerRecommendationsCache(ctx context.Context, workerID string) error {
	return c.DeletePattern(ctx, fmt.Sprintf("worker_recommendations_%s_*", workerID))
}

// InvalidateSearchCache removes all search cache entries
func (c *CacheService) InvalidateSearchCache(ctx context.Context) error {
	errJobs := c.DeletePattern(ctx, "search_jobs_*")
	errWorkers := c.DeletePattern(ctx, "search_workers_*")
	if errJobs != nil {
		return errJobs
	}
	return errWorkers
}

// InvalidateSearchJobsCache removes all job search cache entries
func (c *CacheService) InvalidateSearchJobsCache(ctx context.Context) error {
	return c.DeletePattern(ctx, "search_jobs_*")
}

// InvalidateSearchWorkersCache removes all worker search cache entries
func (c *CacheService) InvalidateSearchWorkersCache(ctx context.Context) error {
	return c.DeletePattern(ctx, "search_workers_*")
}

// InvalidateAllWorkerRecommendations removes all worker recommendation caches
func (c *CacheService) InvalidateAllWorkerRecommendations(ctx context.Context) error {
	return c.DeletePattern(ctx, "worker_recommendations_*")
}

// ============================================================================
// CACHE KEY BUILDERS
// ============================================================================

// JobsFeedCacheKey builds the cache key for jobs feed
func JobsFeedCacheKey(page int) string {
	return fmt.Sprintf(CacheKeyJobsFeed, page)
}

// WorkerRecommendationsCacheKey builds the cache key for worker recommendations
func WorkerRecommendationsCacheKey(workerID string, page int) string {
	return fmt.Sprintf(CacheKeyWorkerRecommendations, workerID, page)
}

// SearchWorkersCacheKey builds the cache key for worker search results
// Uses MD5 hash of the request body to create a unique key
func SearchWorkersCacheKey(requestBody interface{}) string {
	data, _ := json.Marshal(requestBody)
	hash := md5.Sum(data)
	return fmt.Sprintf(CacheKeySearchWorkers, fmt.Sprintf("%x", hash))
}

// SearchJobsCacheKey builds the cache key for job search results
// Uses MD5 hash of the request body to create a unique key
func SearchJobsCacheKey(requestBody interface{}) string {
	data, _ := json.Marshal(requestBody)
	hash := md5.Sum(data)
	return fmt.Sprintf(CacheKeySearchJobs, fmt.Sprintf("%x", hash))
}

// ============================================================================
// CACHED RESPONSE WRAPPER
// ============================================================================

// CachedPaginatedResult wraps paginated results for caching
type CachedPaginatedResult struct {
	Data  interface{} `json:"data"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}
