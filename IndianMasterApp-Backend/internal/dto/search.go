package dto

// WorkerSearchRequest represents search criteria for workers
type WorkerSearchRequest struct {
	Role            string `json:"role" form:"role"`
	City            string `json:"city" form:"city"`
	ExperienceMin   int    `json:"experienceMin" form:"experienceMin"`
	ExperienceMax   int    `json:"experienceMax" form:"experienceMax"`
	Language        string `json:"language" form:"language"`
	SalaryMin       int    `json:"salaryMin" form:"salaryMin"`
	SalaryMax       int    `json:"salaryMax" form:"salaryMax"`
	Availability    string `json:"availability" form:"availability"`
	WorkType        string `json:"workType" form:"workType"`
	VenuePreference string `json:"venuePreference" form:"venuePreference"`
}

// JobSearchRequest represents search criteria for jobs
type JobSearchRequest struct {
	JobRole       string  `json:"jobRole" form:"jobRole"`
	City          string  `json:"city" form:"city"`
	SalaryMin     float64 `json:"salaryMin" form:"salaryMin"`
	SalaryMax     float64 `json:"salaryMax" form:"salaryMax"`
	Language      string  `json:"language" form:"language"`
	BusinessType  string  `json:"businessType" form:"businessType"`
	ExperienceMin int     `json:"experienceMin" form:"experienceMin"`
	ExperienceMax *int    `json:"experienceMax" form:"experienceMax"`
	WorkType      string  `json:"workType" form:"workType"`
	Benefits      string  `json:"benefits" form:"benefits"`
}

// SearchResponse represents a search result item
type SearchResponse struct {
	ID          string      `json:"id"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Location    string      `json:"location"`
	Salary      interface{} `json:"salary"`
	MatchScore  int         `json:"matchScore,omitempty"`
	CreatedAt   string      `json:"createdAt"`
}

// SearchResults represents paginated search results
type SearchResults struct {
	Results []SearchResponse `json:"results"`
	Total   int64            `json:"total"`
	Page    int              `json:"page"`
	Limit   int              `json:"limit"`
}
