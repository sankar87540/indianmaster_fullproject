# Multilingual Support Implementation Guide

## Overview

This guide explains how to implement and maintain multilingual support for the Restaurant Naukri job portal. The system supports:

- **English (en)** - Core system language
- **Tamil (ta)** - User interface language
- **Hindi (hi)** - User interface language

## Architecture Principles

### 1. **English is the Internal System Language**

All structured fields (enums, codes, status values) are stored in English in the database:

```
status = "open"        // Not "թացել" or "खुला"
job_role = "chef"      // Not "ஷெஃபு" or "शेफ"
salary_type = "monthly" // Not "மாதிக" or "मासिक"
```

### 2. **User Content is Stored As-Is**

User-generated content is stored exactly as typed in the user's selected language:

```
job_description = "மாஜான்கள் முதலிய..." (Tamil user input)
company_description = "हमारा रेस्तरां..." (Hindi user input)
address = "123 Main Street" (English user input)
```

### 3. **Translations Happen During Response**

Enum values are translated on-the-fly based on the client's requested language:

**Database:** `job_role = "chef"`
**API Response (lang=en):** `"job_role": "Chef"`
**API Response (lang=ta):** `"job_role": "ஷெஃபு"`
**API Response (lang=hi):** `"job_role": "शेफ"`

## Database Schema

### New Columns

Three new columns added (non-breaking migration):

```sql
jobs.language_code VARCHAR(5) DEFAULT 'en'
job_seekers.language_code VARCHAR(5) DEFAULT 'en'
employers.language_code VARCHAR(5) DEFAULT 'en'
```

Valid values: `'en'`, `'ta'`, `'hi'`

Migration files:
- `/migrations/000003_add_multilingual_support.up.sql` - Add columns
- `/migrations/000003_add_multilingual_support.down.sql` - Rollback

## Go Code Organization

### Package Structure

```
internal/
├── i18n/
│   ├── constants.go      # Language codes, validation
│   └── translations.go   # Translation maps for all enums
├── middleware/
│   └── language.go       # Language detection middleware
├── transform/
│   └── responses.go      # Response transformation (translation)
└── ... (existing)
```

### Key Files

**1. `internal/i18n/constants.go`**
- Language code constants
- Validation functions
- Language listing

**2. `internal/i18n/translations.go`**
- Translation maps for all enums
- Helper functions for each enum type

**3. `internal/middleware/language.go`**
- Middleware for language detection
- Context helpers

**4. `internal/transform/responses.go`**
- Transform functions for each response type
- Preserves user content, translates enums

## Usage Examples

### 1. Update Job Handler to Use Middleware and Translate Responses

**Before:**
```go
// No language support
func (h *JobHandler) Get(w http.ResponseWriter, r *http.Request) {
    // ... get job from DB ...
    json.NewEncoder(w).Encode(job)
}
```

**After:**
```go
import (
    "myapp/internal/middleware"
    "myapp/internal/transform"
)

func (h *JobHandler) Get(w http.ResponseWriter, r *http.Request) {
    // ... get job from DB ...
    
    // Get language from context/request
    lang := middleware.GetLanguageFromContext(r)
    
    // Transform response (translate enums, preserve user content)
    transformed := transform.TranslateJob(job, lang)
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(transformed)
}
```

### 2. Register Handler with Middleware in Routes

**Before:**
```go
mux.HandleFunc("/api/v1/jobs", jobHandler.List)
mux.HandleFunc("/api/v1/jobs/", func(w http.ResponseWriter, r *http.Request) {
    // ID extraction...
    jobHandler.Get(w, r)
})
```

**After:**
```go
import (
    "myapp/internal/middleware"
)

mux.HandleFunc("/api/v1/jobs", middleware.LanguageMiddleware(
    http.HandlerFunc(jobHandler.List),
))
mux.HandleFunc("/api/v1/jobs/", middleware.LanguageMiddleware(
    http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // ID extraction...
        jobHandler.Get(w, r)
    }),
))
```

### 3. Handle Language Parameter in Request

**Request with language parameter:**
```
GET /api/v1/jobs/123?lang=ta
GET /api/v1/jobs?job_role=chef&lang=hi
```

**Request with Accept-Language header:**
```
GET /api/v1/jobs/123
Accept-Language: ta
```

Both are automatically detected by the middleware.

### 4. Creating Content with Language Preference

**Request:**
```json
POST /api/v1/jobs
{
    "employer_id": "...",
    "job_title": "Head Chef",
    "job_description": "We are looking for an experienced head chef...",
    "job_role": "chef",
    "salary_type": "monthly",
    "language_code": "en"
}
```

**Handler Update:**
```go
func (h *JobHandler) Create(w http.ResponseWriter, r *http.Request) {
    var req models.CreateJobRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    // Validate language code if provided
    if req.LanguageCode != "" && !i18n.IsValidLanguage(req.LanguageCode) {
        http.Error(w, "Invalid language code", http.StatusBadRequest)
        return
    }
    
    // Default to English if not specified
    if req.LanguageCode == "" {
        req.LanguageCode = i18n.GetDefaultLanguage()
    }
    
    // ... rest of handler ...
}
```

## Translation Maps

All enum translations are defined in `internal/i18n/translations.go`:

### Available Translation Maps

1. **StatusTranslations** - Job and application statuses
   - `open`, `closed`, `filled`, `pending`, `applied`, `rejected`, `interviewed`, `selected`, `offer_accepted`

2. **JobRoleTranslations** - All job roles
   - `chef`, `sous_chef`, `cook`, `waiter`, `server`, `bartender`, `cashier`, etc.

3. **SalaryTypeTranslations** - Salary types
   - `monthly`, `daily`, `hourly`

4. **ShiftTimingTranslations** - Shift timings
   - `morning`, `evening`, `night`, `rotational`, `flexible`, `split`

5. **EmploymentTypeTranslations** - Employment types
   - `full_time`, `part_time`, `contract`, `temporary`, `internship`

6. **BusinessTypeTranslations** - Business types
   - `restaurant`, `cloud_kitchen`, `hotel`, `cafe`, `bar`, `catering`, `food_court`, `quick_service`

### Helper Functions

```go
import "myapp/internal/i18n"

// Direct translation
translated := i18n.TranslateJobRole("chef", "ta")      // Returns "ஷெஃபு"
translated := i18n.TranslateSalaryType("monthly", "hi") // Returns "मासिक"

// With fallback
translated := i18n.Translate(i18n.JobRoleTranslations, "chef", "ta")

// Validate language
if !i18n.IsValidLanguage(lang) {
    lang = i18n.GetDefaultLanguage()
}
```

## Response Transformation

Use the `transform` package to convert database records to API responses:

```go
import "myapp/internal/transform"

// Single job
job := models.Job{ ... }           // From database
lang := middleware.GetLanguageFromContext(r)
transformed := transform.TranslateJob(&job, lang)
json.NewEncoder(w).Encode(transformed) // Enums translated, user content preserved

// Multiple jobs
jobs := []models.Job{ ... }
transformed := transform.TranslateJobs(jobs, lang)
json.NewEncoder(w).Encode(transformed)

// Employer
emp := models.Employer{ ... }
transformed := transform.TranslateEmployer(&emp, lang)
json.NewEncoder(w).Encode(transformed)

// Job seeker
seeker := models.JobSeeker{ ... }
transformed := transform.TranslateJobSeeker(&seeker, lang)
json.NewEncoder(w).Encode(transformed)
```

## Middleware Integration

### Option 1: Global Middleware

```go
// In routes/routes.go
func RegisterRoutesWithDB(mux *http.ServeMux, db *sql.DB) {
    // Create handlers
    jobHandler := handlers.NewJobHandler(db)
    // ... other handlers ...
    
    // Wrap all handlers with language middleware
    mux.Handle("/api/v1/jobs", 
        middleware.LanguageMiddleware(
            http.HandlerFunc(jobHandler.List),
        ),
    )
    // ... other routes ...
}
```

### Option 2: Per-Route Middleware

```go
mux.HandleFunc("/api/v1/jobs", func(w http.ResponseWriter, r *http.Request) {
    // Get language directly without middleware
    lang := middleware.DetectLanguage(r)
    
    // Use language in handler
    // ...
})
```

### Option 3: Extract in Handler

```go
func (h *JobHandler) List(w http.ResponseWriter, r *http.Request) {
    // Get language from context (if middleware applied)
    lang := middleware.GetLanguageFromContext(r)
    
    // Or detect directly
    if lang == "" {
        lang = middleware.DetectLanguage(r)
    }
    
    // ... rest of handler ...
}
```

## Database Queries

**When inserting data:**

```go
// Insert with language preference
err := db.QueryRow(`
    INSERT INTO jobs (
        employer_id, location_id, job_title, job_role, 
        job_description, language_code, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING id
`, req.EmployerID, req.LocationID, req.JobTitle, req.JobRole, 
   req.JobDescription, req.LanguageCode, "open").Scan(&id)
```

**When retrieving data:**

```go
// Query doesn't change - language_code is just another column
rows, _ := db.Query(`
    SELECT id, employer_id, job_role, language_code, job_description, ...
    FROM jobs WHERE id = $1
`, jobID)

// Translate on read
for rows.Next() {
    var job models.Job
    rows.Scan(&job.ID, &job.EmployerID, &job.JobRole, &job.LanguageCode, ...)
    
    // Transform before sending to client
    transformed := transform.TranslateJob(&job, requestedLang)
    json.NewEncoder(w).Encode(transformed)
}
```

## Frontend Integration

### 1. Send Language Preference

**Option A: Query Parameter**
```javascript
// Fetch in English
fetch('/api/v1/jobs?lang=en')

// Fetch in Tamil
fetch('/api/v1/jobs?lang=ta')

// Fetch with other parameters
fetch('/api/v1/jobs?job_role=chef&shift_timing=morning&lang=hi')
```

**Option B: Accept-Language Header**
```javascript
fetch('/api/v1/jobs', {
    headers: {
        'Accept-Language': 'ta'
    }
})
```

### 2. Create Content with Language

```javascript
const jobData = {
    employer_id: "123",
    job_title: "ஹெட் ஷெஃபு",  // Tamil
    job_description: "ஆற்றிய கட்டளைக்கு உரியவரைத் தேடுகிறோம்...",
    job_role: "chef",  // Still English code
    salary_type: "monthly",  // Still English code
    language_code: "ta"  // Specify Tamil
};

await fetch('/api/v1/jobs', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(jobData)
});
```

### 3. Display Translated Responses

```javascript
// API returns transformed data
const response = await fetch('/api/v1/jobs/123?lang=ta');
const job = await response.json();

console.log(job.job_role);        // "ஷெஃபு" (translated)
console.log(job.job_description); // Original Tamil text (not translated)
console.log(job.salary_type);     // "மாதிக" (translated)
console.log(job.language_code);   // "ta" (user's input language)
```

## Best Practices

### 1. **Always Validate Language on Create/Update**

```go
if req.LanguageCode != "" && !i18n.IsValidLanguage(req.LanguageCode) {
    http.Error(w, "Invalid language code", http.StatusBadRequest)
    return
}
if req.LanguageCode == "" {
    req.LanguageCode = i18n.GetDefaultLanguage()
}
```

### 2. **Always Translate Responses**

```go
// ❌ Don't do this (returns untranslated enums)
json.NewEncoder(w).Encode(job)

// ✅ Do this (returns translated enums)
lang := middleware.GetLanguageFromContext(r)
transformed := transform.TranslateJob(&job, lang)
json.NewEncoder(w).Encode(transformed)
```

### 3. **Add Language to List Responses**

```go
// When returning multiple records
jobs := []models.Job{ ... }
lang := middleware.GetLanguageFromContext(r)
transformed := transform.TranslateJobs(jobs, lang)

response := map[string]interface{}{
    "data": transformed,
    "count": len(transformed),
    "language": lang,  // Confirm language used
}
json.NewEncoder(w).Encode(response)
```

### 4. **Handle Missing Translations Gracefully**

The system has fallback logic:

```
1. Check translation in requested language
2. If not found, fallback to English
3. If not found in English, return original code
```

This ensures no crashes even if a new status is added without translations.

### 5. **Index by Language Code**

```sql
-- These indexes are already created in migration
CREATE INDEX idx_jobs_language_code ON jobs(language_code);
CREATE INDEX idx_job_seekers_language_code ON job_seekers(language_code);
CREATE INDEX idx_employers_language_code ON employers(language_code);
```

Use for filtering if needed:
```go
// Get jobs created in a specific language
sql := `SELECT * FROM jobs WHERE language_code = $1`
```

### 6. **Document User Content Fields**

Mark fields that should NOT be translated:

```go
type Job struct {
    // ... enum fields (will be translated) ...
    JobRole string `json:"job_role"`
    
    // User content fields (NOT translated, stored as-is)
    JobDescription string `json:"job_description"`
    Benefits string `json:"benefits"`
    // ...
}
```

### 7. **Consider Translation File Format for Future**

If adding more languages or complex translations later, consider moving to JSON/YAML files:

```
translations/
├── en.json  # English translations
├── ta.json  # Tamil translations
└── hi.json  # Hindi translations
```

For now, the Go maps in `translations.go` are sufficient and performant.

## Testing

### Test Language Detection

```go
package middleware

import (
    "net/http"
    "testing"
)

func TestLanguageDetection(t *testing.T) {
    // Test query parameter
    req := httptest.NewRequest("GET", "/api/v1/jobs?lang=ta", nil)
    lang := DetectLanguage(req)
    if lang != "ta" {
        t.Errorf("Expected 'ta', got '%s'", lang)
    }
    
    // Test Accept-Language header
    req = httptest.NewRequest("GET", "/api/v1/jobs", nil)
    req.Header.Set("Accept-Language", "hi")
    lang = DetectLanguage(req)
    if lang != "hi" {
        t.Errorf("Expected 'hi', got '%s'", lang)
    }
}
```

### Test Translations

```go
package i18n

import "testing"

func TestJobRoleTranslation(t *testing.T) {
    tests := []struct {
        role string
        lang string
        want string
    }{
        {"chef", "en", "Chef"},
        {"chef", "ta", "ஷெஃபு"},
        {"chef", "hi", "शेफ"},
    }
    
    for _, tt := range tests {
        got := TranslateJobRole(tt.role, tt.lang)
        if got != tt.want {
            t.Errorf("TranslateJobRole(%q, %q) = %q; want %q", 
                tt.role, tt.lang, got, tt.want)
        }
    }
}
```

## Migration Checklist

- [ ] Run migration: `migrate -path ./migrations -database "..." up`
- [ ] Verify new columns added: `\d jobs` in psql
- [ ] Update all handlers to use `transform` package
- [ ] Register language middleware in routes
- [ ] Add language context to all handlers
- [ ] Test with `?lang=ta` and `?lang=hi` parameters
- [ ] Update frontend to send language parameter
- [ ] Document language parameter in API docs
- [ ] Add error handling for invalid language codes

## Maintenance

### Adding a New Language

1. **Add to constants:**
   ```go
   // internal/i18n/constants.go
   const LanguageBengali = "bn"
   
   var SupportedLanguages = []string{
       LanguageEnglish,
       LanguageTamil,
       LanguageHindi,
       LanguageBengali,  // New
   }
   ```

2. **Update migration constraint:**
   ```sql
   ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_language_code_check;
   ALTER TABLE jobs ADD CONSTRAINT jobs_language_code_check 
       CHECK (language_code IN ('en', 'ta', 'hi', 'bn'));
   ```

3. **Add translations:**
   ```go
   // internal/i18n/translations.go
   var JobRoleTranslations = map[string]map[string]string{
       // ... existing ...
       LanguageBengali: {
           "chef": "শেফ",
           // ... etc ...
       },
   }
   ```

### Adding a New Enum Type

1. **Add translation map:**
   ```go
   var NewFieldTranslations = map[string]map[string]string{
       LanguageEnglish: {
           "value1": "Value One",
           "value2": "Value Two",
       },
       LanguageTamil: {
           "value1": "மதிப்பு ஒன்று",
           "value2": "மதிப்பு இரண்டு",
       },
       // ... other languages ...
   }
   ```

2. **Add helper function:**
   ```go
   func TranslateNewField(value, lang string) string {
       return Translate(NewFieldTranslations, value, lang)
   }
   ```

3. **Update transform response struct:**
   ```go
   type SomeTransformed struct {
       // ...
       NewField string `json:"new_field"` // Will be translated
   }
   ```

4. **Update transform function:**
   ```go
   func TranslateSome(some *models.Some, lang string) SomeTransformed {
       return SomeTransformed{
           // ...
           NewField: i18n.TranslateNewField(some.NewField, lang), // TRANSLATED
       }
   }
   ```

## Performance Considerations

1. **In-Memory Translations** - All translations are in memory (maps), no DB lookups
2. **Index on language_code** - For filtering by language if needed
3. **No API Calls** - No external translation APIs, fully self-contained
4. **Constant Time Lookup** - O(1) translation lookups via Go maps

## Security Notes

1. **Language Validation** - Validate language parameter to prevent injection
2. **User Content Storage** - UTF-8 is fully supported in PostgreSQL
3. **No Translation Injection** - Since translations are hardcoded, no SQL injection
4. **No XSS in Responses** - JSON output is properly escaped

---

## Quick Start Checklist

- [x] Created migration: `000003_add_multilingual_support.up/down.sql`
- [x] Created `internal/i18n/constants.go` - Language codes and validation
- [x] Created `internal/i18n/translations.go` - Translation maps for 6 enum types
- [x] Created `internal/middleware/language.go` - Language detection middleware
- [x] Created `internal/transform/responses.go` - Response transformation (translation)
- [x] Updated models to include `language_code` field
- [ ] Update all handlers to use `transform` package
- [ ] Register language middleware in routes
- [ ] Test with manual requests
- [ ] Update API documentation
