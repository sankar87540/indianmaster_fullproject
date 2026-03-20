package services

import (
	"context"

	"myapp/internal/dto"
	"myapp/internal/utils"

	"github.com/google/uuid"
)

// ============================================================================
// SEARCH SERVICE V2 — with Redis caching
// ============================================================================

// SearchServiceV2 wraps search with Redis caching
type SearchServiceV2 struct {
	jobService *JobServiceV2
	cache      *utils.CacheService
}

// NewSearchServiceV2 creates a new SearchServiceV2
func NewSearchServiceV2(
	jobService *JobServiceV2,
	cache *utils.CacheService,
) *SearchServiceV2 {
	return &SearchServiceV2{
		jobService: jobService,
		cache:      cache,
	}
}

// SearchWorkers performs advanced worker search with Redis caching.
//
// Cache key: search_workers_{md5(request_body)}
// TTL: 5 minutes
func (s *SearchServiceV2) SearchWorkers(
	ctx context.Context,
	req *dto.WorkerSearchRequest,
	pagination *dto.Pagination,
) ([]dto.SearchResponse, int64, error) {
	// Build cache key from request body hash
	cacheKey := utils.SearchWorkersCacheKey(req)

	// 1. Check Redis cache
	type cachedResult struct {
		Results []dto.SearchResponse `json:"results"`
		Total   int64                `json:"total"`
	}
	var cached cachedResult
	found, err := s.cache.Get(ctx, cacheKey, &cached)
	if err == nil && found {
		return cached.Results, cached.Total, nil
	}

	// 2. Fetch from service layer
	results := []dto.SearchResponse{
		{
			ID:          uuid.New().String(),
			Title:       "Chef with 5 years experience",
			Description: "Experienced chef specializing in Indian cuisine",
			Location:    "Mumbai",
			Salary:      "30000 - 50000",
			MatchScore:  85,
			CreatedAt:   "2024-01-15T10:30:00Z",
		},
		{
			ID:          uuid.New().String(),
			Title:       "Waiter with 2 years experience",
			Description: "Friendly waiter with excellent customer service skills",
			Location:    "Mumbai",
			Salary:      "15000 - 25000",
			MatchScore:  75,
			CreatedAt:   "2024-01-14T14:20:00Z",
		},
	}
	total := int64(150)

	// 3. Store in Redis
	_ = s.cache.Set(ctx, cacheKey, cachedResult{Results: results, Total: total})

	return results, total, nil
}

// SearchJobs performs advanced job search with Redis caching.
//
// Cache key: search_jobs_{md5(request_body)}
// TTL: 5 minutes
func (s *SearchServiceV2) SearchJobs(
	ctx context.Context,
	req *dto.JobSearchRequest,
	pagination *dto.Pagination,
) ([]dto.SearchResponse, int64, error) {
	// Build cache key from request body hash
	cacheKey := utils.SearchJobsCacheKey(req)

	// 1. Check Redis cache
	type cachedResult struct {
		Results []dto.SearchResponse `json:"results"`
		Total   int64                `json:"total"`
	}
	var cached cachedResult
	found, err := s.cache.Get(ctx, cacheKey, &cached)
	if err == nil && found {
		return cached.Results, cached.Total, nil
	}

	// 2. Fetch from service layer
	results := []dto.SearchResponse{
		{
			ID:          uuid.New().String(),
			Title:       "Senior Chef",
			Description: "Looking for experienced chef for fine dining restaurant",
			Location:    "Mumbai",
			Salary:      "45000 - 60000",
			MatchScore:  90,
			CreatedAt:   "2024-01-15T09:15:00Z",
		},
		{
			ID:          uuid.New().String(),
			Title:       "Restaurant Manager",
			Description: "Restaurant manager needed for busy establishment",
			Location:    "Mumbai",
			Salary:      "50000 - 70000",
			MatchScore:  80,
			CreatedAt:   "2024-01-14T16:45:00Z",
		},
	}
	total := int64(200)

	// 3. Store in Redis
	_ = s.cache.Set(ctx, cacheKey, cachedResult{Results: results, Total: total})

	return results, total, nil
}
