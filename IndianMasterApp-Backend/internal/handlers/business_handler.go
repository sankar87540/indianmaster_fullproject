package handlers

import (
	"myapp/internal/dto"
	"myapp/internal/models"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
)

type BusinessHandler struct {
	businessService services.BusinessService
}

func NewBusinessHandler(businessService services.BusinessService) *BusinessHandler {
	return &BusinessHandler{businessService: businessService}
}

// CreateBusiness POST /businesses
func (h *BusinessHandler) CreateBusiness(c *gin.Context) {
	var req dto.CreateBusinessRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	business := &models.Business{
		OwnerID:      req.OwnerID,
		BusinessName: req.BusinessName,
		OwnerName:    req.OwnerName,
		ContactRole:  req.ContactRole,
		BusinessType: req.BusinessType,
		Email:        req.Email,
		MobileNumber: req.MobileNumber,
		FSAILicense:  req.FSAILicense,
		GSTNumber:    req.GSTNumber,
		LogoURL:      req.LogoURL,
		City:         req.City,
		State:        req.State,
		AddressText:  req.AddressText,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
		Language:     req.Language,
		IsActive:     true,
	}

	if err := h.businessService.CreateBusiness(c.Request.Context(), business); err != nil {
		handleError(c, err)
		return
	}

	dto.CreatedResponse(c, "Business created successfully", business)
}

// GetBusiness GET /businesses/:id
func (h *BusinessHandler) GetBusiness(c *gin.Context) {
	id := c.Param("id")

	business, err := h.businessService.GetBusiness(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	dto.OKResponse(c, "Business retrieved successfully", business)
}

// UpdateBusiness PUT /businesses/:id
func (h *BusinessHandler) UpdateBusiness(c *gin.Context) {
	id := c.Param("id")

	var req dto.CreateBusinessRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	// Create business model to update
	business := &models.Business{
		ID:           id,
		BusinessName: req.BusinessName,
		OwnerName:    req.OwnerName,
		ContactRole:  req.ContactRole,
		BusinessType: req.BusinessType,
		Email:        req.Email,
		MobileNumber: req.MobileNumber,
		FSAILicense:  req.FSAILicense,
		GSTNumber:    req.GSTNumber,
		LogoURL:      req.LogoURL,
		City:         req.City,
		State:        req.State,
		AddressText:  req.AddressText,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
		Language:     req.Language,
	}

	if err := h.businessService.UpdateBusiness(c.Request.Context(), business); err != nil {
		handleError(c, err)
		return
	}

	dto.OKResponse(c, "Business updated successfully", business)
}

// DeleteBusiness DELETE /businesses/:id
func (h *BusinessHandler) DeleteBusiness(c *gin.Context) {
	id := c.Param("id")

	if err := h.businessService.DeleteBusiness(c.Request.Context(), id); err != nil {
		handleError(c, err)
		return
	}

	dto.OKResponse(c, "Business deleted successfully", nil)
}

// ListBusinessesByCity GET /businesses?city=CITY
// @Summary List Businesses by City
// @Description Retrieve paginated list of businesses filtered by city
// @Tags Business
// @Accept json
// @Produce json
// @Param city query string true "City to filter by"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., created_at, business_name)" default(created_at)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Businesses retrieved successfully with pagination metadata"
// @Failure 400 {object} dto.APIResponse "Invalid request parameters"
// @Failure 500 {object} dto.APIResponse "Failed to fetch businesses"
// @Router /businesses [get]
func (h *BusinessHandler) ListBusinessesByCity(c *gin.Context) {
	city := c.Query("city")
	if city == "" {
		dto.BadRequestResponse(c, "City query parameter is required", nil)
		return
	}

	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Get businesses with pagination
	businesses, total, err := h.businessService.ListBusinessesByCityWithPagination(c.Request.Context(), city, pagination)
	if err != nil {
		handleError(c, err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Businesses retrieved successfully", businesses, total, pagination.Page, pagination.Limit)
}

// ListBusinessesByType GET /businesses?type=TYPE
// @Summary List Businesses by Type
// @Description Retrieve paginated list of businesses filtered by business type
// @Tags Business
// @Accept json
// @Produce json
// @Param type query string true "Business type to filter by"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., created_at, business_name)" default(created_at)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Businesses retrieved successfully with pagination metadata"
// @Failure 400 {object} dto.APIResponse "Invalid request parameters"
// @Failure 500 {object} dto.APIResponse "Failed to fetch businesses"
// @Router /businesses [get]
func (h *BusinessHandler) ListBusinessesByType(c *gin.Context) {
	businessType := c.Query("type")
	if businessType == "" {
		dto.BadRequestResponse(c, "Type query parameter is required", nil)
		return
	}

	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Get businesses with pagination
	businesses, total, err := h.businessService.ListBusinessesByTypeWithPagination(c.Request.Context(), businessType, pagination)
	if err != nil {
		handleError(c, err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Businesses retrieved successfully", businesses, total, pagination.Page, pagination.Limit)
}

// ListActiveBusinesses GET /businesses
// @Summary List Active Businesses
// @Description Retrieve paginated list of all active businesses
// @Tags Business
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., created_at, business_name)" default(created_at)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Active businesses retrieved successfully with pagination metadata"
// @Failure 500 {object} dto.APIResponse "Failed to fetch active businesses"
// @Router /businesses/active [get]
func (h *BusinessHandler) ListActiveBusinesses(c *gin.Context) {
	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Get active businesses with pagination
	businesses, total, err := h.businessService.ListActiveBusinessesWithPagination(c.Request.Context(), pagination)
	if err != nil {
		handleError(c, err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Active businesses retrieved successfully", businesses, total, pagination.Page, pagination.Limit)
}

// GetBusinessesByOwner GET /businesses/owner/:owner_id
// @Summary List Businesses by Owner
// @Description Retrieve paginated list of businesses owned by a specific user
// @Tags Business
// @Accept json
// @Produce json
// @Param owner_id path string true "Owner ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., created_at, business_name)" default(created_at)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Businesses retrieved successfully with pagination metadata"
// @Failure 400 {object} dto.APIResponse "Invalid request parameters"
// @Failure 500 {object} dto.APIResponse "Failed to fetch businesses"
// @Router /businesses/owner/{owner_id} [get]
func (h *BusinessHandler) GetBusinessesByOwner(c *gin.Context) {
	ownerID := c.Param("owner_id")
	if ownerID == "" {
		dto.BadRequestResponse(c, "Owner ID parameter is required", nil)
		return
	}

	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Get businesses with pagination
	businesses, total, err := h.businessService.GetBusinessesByOwnerWithPagination(c.Request.Context(), ownerID, pagination)
	if err != nil {
		handleError(c, err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Businesses retrieved successfully", businesses, total, pagination.Page, pagination.Limit)
}
