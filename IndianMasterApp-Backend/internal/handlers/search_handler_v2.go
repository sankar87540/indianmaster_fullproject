package handlers

import (
	"myapp/internal/dto"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
)

// ============================================================================
// SEARCH HANDLER V2 — uses SearchServiceV2 with Redis caching
// ============================================================================

// SearchHandlerV2 handles search endpoints with caching support
type SearchHandlerV2 struct {
	searchService *services.SearchServiceV2
}

// NewSearchHandlerV2 creates a new SearchHandlerV2
func NewSearchHandlerV2(searchService *services.SearchServiceV2) *SearchHandlerV2 {
	return &SearchHandlerV2{searchService: searchService}
}

// SearchWorkers handles advanced worker search with Redis caching
// @Summary Search Workers (Cached)
// @Description Perform advanced search on workers with multiple filters. Results are cached in Redis for 5 minutes.
// @Tags Search
// @Accept json
// @Produce json
// @Param request body dto.WorkerSearchRequest true "Search criteria"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., match_score, experience_years)" default(match_score)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Workers found successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request parameters"
// @Failure 500 {object} dto.APIResponse "Failed to search workers"
// @Router /search/workers [post]
// @Security BearerAuth
func (h *SearchHandlerV2) SearchWorkers(c *gin.Context) {
	var req dto.WorkerSearchRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	pagination := dto.ParsePagination(c)

	results, total, err := h.searchService.SearchWorkers(c.Request.Context(), &req, pagination)
	if err != nil {
		internalError(c, "Failed to search workers", err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Workers found successfully", results, total, pagination.Page, pagination.Limit)
}

// SearchJobs handles advanced job search with Redis caching
// @Summary Search Jobs (Cached)
// @Description Perform advanced search on jobs with multiple filters. Results are cached in Redis for 5 minutes.
// @Tags Search
// @Accept json
// @Produce json
// @Param request body dto.JobSearchRequest true "Search criteria"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., match_score, salary)" default(match_score)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Jobs found successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request parameters"
// @Failure 500 {object} dto.APIResponse "Failed to search jobs"
// @Router /search/jobs [post]
// @Security BearerAuth
func (h *SearchHandlerV2) SearchJobs(c *gin.Context) {
	var req dto.JobSearchRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	pagination := dto.ParsePagination(c)

	results, total, err := h.searchService.SearchJobs(c.Request.Context(), &req, pagination)
	if err != nil {
		internalError(c, "Failed to search jobs", err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Jobs found successfully", results, total, pagination.Page, pagination.Limit)
}
