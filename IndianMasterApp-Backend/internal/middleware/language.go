package middleware

import (
	"context"
	"net/http"
	"strings"

	"myapp/internal/i18n"
)

// LanguageMiddleware wraps HTTP handlers to detect and store language preference in context
func LanguageMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		lang := DetectLanguage(r)
		ctx := context.WithValue(r.Context(), "language", lang)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// DetectLanguage detects language from query parameter, headers, or defaults to English
// Priority: ?lang query parameter > Accept-Language header > default English
func DetectLanguage(r *http.Request) string {
	// 1. Check ?lang query parameter
	if lang := r.URL.Query().Get("lang"); lang != "" {
		if i18n.IsValidLanguage(lang) {
			return lang
		}
	}

	// 2. Check Accept-Language header
	if acceptLang := r.Header.Get("Accept-Language"); acceptLang != "" {
		// Parse Accept-Language header (simple parsing, ignores q values)
		langs := strings.Split(acceptLang, ",")
		for _, lang := range langs {
			// Remove whitespace and q values
			lang = strings.TrimSpace(lang)
			lang = strings.Split(lang, ";")[0]

			// Check for exact match and language prefix match
			if i18n.IsValidLanguage(lang) {
				return lang
			}

			// Check language prefix (e.g., "en-US" -> "en")
			if len(lang) >= 2 {
				prefix := lang[:2]
				if i18n.IsValidLanguage(prefix) {
					return prefix
				}
			}
		}
	}

	// 3. Default to English
	return i18n.GetDefaultLanguage()
}

// GetLanguageFromContext retrieves the language from request context
func GetLanguageFromContext(r *http.Request) string {
	if lang, ok := r.Context().Value("language").(string); ok {
		return lang
	}
	return ""
}

// LanguageFromContext is an alias for GetLanguageFromContext
func LanguageFromContext(r *http.Request) string {
	return GetLanguageFromContext(r)
}
