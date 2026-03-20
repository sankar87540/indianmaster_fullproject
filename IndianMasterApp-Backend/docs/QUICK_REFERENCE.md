# Multilingual System - Quick Reference Card

## 📋 Cheat Sheet

### Language Codes
| Code | Language |
|------|----------|
| en   | English  |
| ta   | Tamil    |
| hi   | Hindi    |

### File Structure
```
myapp/
├── internal/
│   ├── i18n/
│   │   ├── constants.go      # Language validation & constants
│   │   ├── translations.go   # Translation maps (6 enum types)
│   │   └── helpers.go        # Utility helpers & dictionaries
│   ├── middleware/
│   │   └── language.go       # Language detection & context
│   ├── transform/
│   │   └── responses.go      # Response transformation (translate enums)
│   ├── models/
│   │   ├── jobs.go           # Updated with language_code
│   │   ├── employer.go       # Updated with language_code
│   │   └── job_seeker.go     # Updated with language_code
│   ├── handlers/             # TODO: Update to use transform package
│   └── routes/               # TODO: Register language middleware
├── migrations/
│   ├── 000003_add_multilingual_support.up.sql     # ADD columns (created ✓)
│   └── 000003_add_multilingual_support.down.sql   # ROLLBACK (created ✓)
└── docs/
    ├── MULTILINGUAL_GUIDE.md         # Complete implementation guide
    ├── API_INTEGRATION_GUIDE.md       # Frontend integration guide
    └── IMPLEMENTATION_EXAMPLES.go     # Working code examples
```

### Core Imports for Handlers
```go
import (
    "myapp/internal/i18n"
    "myapp/internal/middleware"
    "myapp/internal/transform"
)
```

### Common Code Patterns

#### 1. Get Language from Request
```go
lang := middleware.GetLanguageFromContext(r)
if lang == "" {
    lang = middleware.DetectLanguage(r)
}
```

#### 2. Translate Enum Values
```go
translated := i18n.TranslateJobRole("chef", "ta")           // Returns "ஷெஃபு"
translated := i18n.TranslateSalaryType("monthly", "hi")      // Returns "मासिक"
translated := i18n.TranslateStatus("open", "ta")             // Returns "திறந்திருக்கும்"
```

#### 3. Transform Response (Main Pattern!)
```go
job := models.Job{ /* from database */ }
lang := middleware.GetLanguageFromContext(r)
transformed := transform.TranslateJob(&job, lang)
json.NewEncoder(w).Encode(transformed)
```

#### 4. Validate Language on Create
```go
if req.LanguageCode == "" {
    req.LanguageCode = i18n.GetDefaultLanguage()
} else if !i18n.IsValidLanguage(req.LanguageCode) {
    http.Error(w, "Invalid language code", http.StatusBadRequest)
    return
}
```

#### 5. Register Handler with Middleware
```go
mux.HandleFunc("/api/v1/jobs", middleware.LanguageMiddleware(
    http.HandlerFunc(jobHandler.List),
))
```

### Translation Functions Quick List

**Status Translations:**
```go
i18n.TranslateStatus(status, lang)
```

**Job Role Translations:**
```go
i18n.TranslateJobRole(role, lang)
```

**Salary Type Translations:**
```go
i18n.TranslateSalaryType(salaryType, lang)
```

**Shift Timing Translations:**
```go
i18n.TranslateShiftTiming(timing, lang)
```

**Employment Type Translations:**
```go
i18n.TranslateEmploymentType(empType, lang)
```

**Business Type Translations:**
```go
i18n.TranslateBusinessType(bizType, lang)
```

### Response Transformation Functions

```go
// Single records
transform.TranslateJob(job, lang)
transform.TranslateEmployer(emp, lang)
transform.TranslateJobSeeker(seeker, lang)

// Multiple records
transform.TranslateJobs(jobs, lang)
transform.TranslateEmployers(employers, lang)
transform.TranslateJobSeekers(seekers, lang)
```

### Language Info Functions

```go
// Check if language is valid
i18n.IsValidLanguage("ta")              // Returns true

// Get default language
i18n.GetDefaultLanguage()               // Returns "en"

// Get all supported languages
i18n.SupportedLanguages                 // []string{"en", "ta", "hi"}

// Get language info
i18n.GetLanguageInfo("ta")              // Returns LanguageInfo struct
i18n.GetAllLanguageInfo()               // []LanguageInfo
```

### Dictionary Functions (for Frontend)

```go
// Get all translations of a type
i18n.GetStatusDictionary()              // []DictionaryEntry
i18n.GetJobRoleDictionary()             // []DictionaryEntry
i18n.GetSalaryTypeDictionary()          // []DictionaryEntry
i18n.GetShiftTimingDictionary()         // []DictionaryEntry
i18n.GetEmploymentTypeDictionary()      // []DictionaryEntry
i18n.GetBusinessTypeDictionary()        // []DictionaryEntry
```

## ⚡ Implementation Checklist

### Phase 1: Database (✓ DONE)
- [x] Create migration files (000003_add_multilingual_support.up/down.sql)
- [ ] Run migrations: `migrate -path ./migrations -database "postgresql://..." up`
- [ ] Verify columns exist: `\d jobs` in psql

### Phase 2: Code Setup (✓ DONE)
- [x] Create i18n package (constants, translations, helpers)
- [x] Create middleware package (language detection)
- [x] Create transform package (response transformation)
- [x] Update model structs to include language_code

### Phase 3: Handler Updates (⏳ TO DO)
For each handler (JobHandler, EmployerHandler, JobSeekerHandler):
- [ ] Import middleware and transform packages
- [ ] Extract language: `lang := middleware.GetLanguageFromContext(r)`
- [ ] Transform response before encoding: `transform.TranslateJob(&job, lang)`
- [ ] Validate language on create/update

### Phase 4: Routes Updates (⏳ TO DO)
- [ ] Register each handler with language middleware
- [ ] Test with `?lang=ta` and `?lang=hi` parameters

### Phase 5: Frontend Integration (⏳ TO DO)
- [ ] Add language parameter to all API calls
- [ ] Implement language switcher UI
- [ ] Fetch translation dictionaries for dropdowns
- [ ] Store language preference in localStorage

### Phase 6: Testing (⏳ TO DO)
- [ ] Test English responses
- [ ] Test Tamil responses
- [ ] Test Hindi responses
- [ ] Test missing translations (fallback to English)
- [ ] Test invalid language code (error or default?)

## 🗄️ Database Schema

### New Columns (All Tables)
```sql
language_code VARCHAR(5) DEFAULT 'en' NOT NULL
CHECK (language_code IN ('en', 'ta', 'hi'))
```

Added to:
- `jobs`
- `job_seekers`
- `employers`

### Example Job Record
```
id              | 550e8400-e29b-41d4-a716-446655440000
job_role        | chef                    (← ALWAYS English in DB)
status          | open                    (← ALWAYS English in DB)
salary_type     | monthly                 (← ALWAYS English in DB)
job_description | "We need experienced..." (← Preserved as typed)
language_code   | en                      (← User's input language)
```

## 🌐 API Examples

### Request English
```
GET /api/v1/jobs?lang=en
GET /api/v1/jobs
Accept-Language: en
```

### Request Tamil
```
GET /api/v1/jobs?lang=ta
GET /api/v1/jobs
Accept-Language: ta
```

### Create in Telugu (if added later)
```json
{
  "job_title": "తెలుగు శీర్షిక",
  "job_description": "తెలుగు వివరణ...",
  "job_role": "chef",              // Still English!
  "language_code": "te"            // Telugu
}
```

## 📝 Translation Keys

### job_role
`chef`, `sous_chef`, `cook`, `waiter`, `waitress`, `server`, `captain`, `bartender`, `barista`, `kitchen_helper`, `dishwasher`, `cashier`, `receptionist`, `restaurant_manager`, `assistant_manager`, `supervisor`, `delivery_person`, `delivery_executive`, `housekeeping`, `cleaner`, `food_runner`, `busboy`, `host`, `hostess`

### status
`open`, `closed`, `filled`, `pending`, `applied`, `rejected`, `interviewed`, `selected`, `offer_accepted`

### salary_type
`monthly`, `daily`, `hourly`

### shift_timing
`morning`, `evening`, `night`, `rotational`, `flexible`, `split`

### employment_type
`full_time`, `part_time`, `contract`, `temporary`, `internship`

### business_type
`restaurant`, `cloud_kitchen`, `hotel`, `cafe`, `bar`, `catering`, `food_court`, `quick_service`

## ❌ Common Mistakes

### ❌ Don't: Return untranslated responses
```go
json.NewEncoder(w).Encode(job)  // WRONG - returns "job_role": "chef"
```

### ✅ Do: Transform before encoding
```go
transformed := transform.TranslateJob(&job, lang)
json.NewEncoder(w).Encode(transformed)  // CORRECT - returns "job_role": "Chef" or "ஷெஃபு"
```

---

### ❌ Don't: Accept translated enum codes
```go
{
  "job_role": "ஷெஃபு"  // WRONG - will cause database error
}
```

### ✅ Do: Always use English codes
```go
{
  "job_role": "chef"   // CORRECT - English code always
}
```

---

### ❌ Don't: Translate user content
```go
// User enters in Tamil → Don't auto-translate to English/Hindi
job_description = translate(user_input)  // WRONG
```

### ✅ Do: Store user content as-is
```go
// User enters in Tamil → Store exactly as typed
job_description = user_input  // CORRECT
language_code = "ta"
```

---

### ❌ Don't: Import wrong packages
```go
import "myapp/i18n"           // WRONG
import "myapp/translate"      // WRONG
```

### ✅ Do: Use correct package paths
```go
import "myapp/internal/i18n"
import "myapp/internal/middleware"
import "myapp/internal/transform"
```

## 🔄 Migration Commands

### View migration status
```bash
migrate -path ./migrations -database "postgresql://..." version
```

### Run migrations
```bash
migrate -path ./migrations -database "postgresql://user:pass@localhost:5432/myapp?sslmode=disable" up
```

### Rollback last migration
```bash
migrate -path ./migrations -database "postgresql://user:pass@localhost:5432/myapp?sslmode=disable" down 1
```

### Connection String Format
```
postgresql://username:password@host:port/database?sslmode=disable
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| MULTILINGUAL_GUIDE.md | Complete implementation guide (70+ KB) |
| API_INTEGRATION_GUIDE.md | Frontend integration examples |
| IMPLEMENTATION_EXAMPLES.go | Working Go code snippets |
| QUICK_REFERENCE.md | This file - quick lookup |

## 🆘 Need Help?

1. **How do I translate a response?**
   → Use `transform.TranslateJob(&job, lang)` before encoding

2. **How do I detect language?**
   → Use `middleware.DetectLanguage(r)` or get from context

3. **What's the difference between language_code and lang parameter?**
   - `lang` parameter = what language API response should use
   - `language_code` column = what language user typed content in

4. **Do I need to update all handlers?**
   → Only handlers that return enum fields. See IMPLEMENTATION_EXAMPLES.go

5. **Can I add more languages?**
   → Yes! Update constants.go, add to translations.go, update migration CHECK constraint

6. **What about CRUD operations?**
   → On CREATE: accept `language_code`, store it
   → On UPDATE: optional to change `language_code`
   → On READ: always use `language_code` to know original input language

## ⚙️ Performance Notes

- ✅ All translations in-memory (maps) - O(1) lookup
- ✅ No database calls for translations
- ✅ No external APIs
- ✅ Indexes on language_code columns
- ✅ Fallback to English if translation missing
- ✅ Fully backward compatible

---

**Last Updated:** Feb 17, 2026  
**Status:** Implementation Ready ✅  
**Next Step:** Update handlers with transform package
