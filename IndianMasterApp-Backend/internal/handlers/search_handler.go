package handlers

import (
	"myapp/internal/dto"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
)

type SearchHandler struct {
	searchService *services.SearchService
}

func NewSearchHandler(searchService *services.SearchService) *SearchHandler {
	return &SearchHandler{searchService: searchService}
}

// SearchWorkers handles advanced worker search with filters
// @Summary Search Workers
// @Description Perform advanced search on workers with multiple filters
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
// @Router /workers/search [post]
func (h *SearchHandler) SearchWorkers(c *gin.Context) {
	var req dto.WorkerSearchRequest

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Perform search
	results, total, err := h.searchService.SearchWorkers(c.Request.Context(), &req, pagination)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to search workers", err.Error())
		return
	}

	// Return paginated response
	dto.PaginatedSuccessResponse(c, "Workers found successfully", results, total, pagination.Page, pagination.Limit)
}

// SearchJobs handles advanced job search with filters
// @Summary Search Jobs
// @Description Perform advanced search on jobs with multiple filters
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
// @Router /jobs/search [post]
func (h *SearchHandler) SearchJobs(c *gin.Context) {
	var req dto.JobSearchRequest

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Perform search
	results, total, err := h.searchService.SearchJobs(c.Request.Context(), &req, pagination)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to search jobs", err.Error())
		return
	}

	// Return paginated response
	dto.PaginatedSuccessResponse(c, "Jobs found successfully", results, total, pagination.Page, pagination.Limit)
}
