package docs

// IMPLEMENTATION_EXAMPLES - This file contains Go code examples for implementing multilingual support
// See /docs/IMPLEMENTATION_EXAMPLES.md in git for the full markdown version with formatted examples
// or see each of the /docs/*.md files for comprehensive guides.
//
// Quick reference:
// - internal/i18n package: Translation maps and language constants
// - internal/middleware package: Language detection and context middleware
// - internal/transform package: Response transformation (translate enums only)
//
// Example middleware usage:
//   mux.HandleFunc("/api/v1/jobs", middleware.LanguageMiddleware(
//       http.HandlerFunc(jobHandler.List),
//   ))
//
// Example handler pattern:
//   func (h *JobHandler) List(w http.ResponseWriter, r *http.Request) {
//       lang := middleware.GetLanguageFromContext(r)
//       if lang == "" {
//           lang = middleware.DetectLanguage(r)
//       }
//       // ... query and transform response ...
//       transformed := transform.TranslateJobs(jobs, lang)
//       json.NewEncoder(w).Encode(transformed)
//   }
//
// For complete working examples with full error handling, database queries,
// and all 7 handler patterns, see:
// - docs/IMPLEMENTATION_SUMMARY.md (technical deep dive)
// - docs/MULTILINGUAL_GUIDE.md (70 KB comprehensive guide)
