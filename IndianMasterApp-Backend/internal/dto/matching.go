package dto

// RecommendedJob represents a job recommendation with match score
type RecommendedJob struct {
	JobID      string `json:"jobId"`
	JobRole    string `json:"jobRole"`
	MatchScore int    `json:"matchScore"`
}

// RecommendedJobsResponse is the response for job recommendations
type RecommendedJobsResponse struct {
	WorkerID string           `json:"workerId"`
	Jobs     []RecommendedJob `json:"jobs"`
	Total    int64            `json:"total"`
}

// JobMatchCriteria represents the matching criteria for scoring
type JobMatchCriteria struct {
	WorkerRoles        []string
	WorkerLanguages    []string
	WorkerCity         string
	WorkerSalaryMin    int
	WorkerSalaryMax    int
	WorkerExperience   int
	WorkerAvailability []string
}

// JobMatchData represents job data for matching
type JobMatchData struct {
	JobID            string
	JobRole          string
	JobRoles         []string
	JobLanguages     []string
	JobCity          string
	JobSalaryMin     float64
	JobSalaryMax     float64
	JobExperienceMin int
	JobExperienceMax *int
	JobAvailability  []string
}
