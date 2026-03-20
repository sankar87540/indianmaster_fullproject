package i18n

import (
	"encoding/json"
)

// ============================================
// HELPER UTILITIES
// ============================================

// TranslateStringArray translates enum values in a string array
// Useful for fields like cuisine_types, preferred_job_roles, etc.
// Note: Only translates if a translation map is provided
func TranslateStringArray(arr []string, translationMap map[string]map[string]string, lang string) []string {
	if len(arr) == 0 {
		return []string{}
	}

	result := make([]string, len(arr))
	for i, val := range arr {
		result[i] = TranslateValue(val, translationMap, lang)
	}
	return result
}

// TranslateValue translates a single value or returns the original if no translation exists
func TranslateValue(value string, translationMap map[string]map[string]string, lang string) string {
	if !IsValidLanguage(lang) {
		lang = GetDefaultLanguage()
	}

	// Check if we have this specific translation map
	if langMap, exists := translationMap[lang]; exists {
		if translated, exists := langMap[value]; exists {
			return translated
		}
	}

	// Fallback to English
	if englishMap, exists := translationMap[LanguageEnglish]; exists {
		if translated, exists := englishMap[value]; exists {
			return translated
		}
	}

	// Return original if not found
	return value
}

// ============================================
// BULK TRANSLATION AIDS
// ============================================

// TranslateJobRoleArray translates multiple job roles
func TranslateJobRoleArray(roles []string, lang string) []string {
	return TranslateStringArray(roles, JobRoleTranslations, lang)
}

// TranslateShiftTimingArray translates multiple shift timings
func TranslateShiftTimingArray(timings []string, lang string) []string {
	return TranslateStringArray(timings, ShiftTimingTranslations, lang)
}

// ============================================
// LANGUAGE INFO RESPONSE
// ============================================

// LanguageInfo provides information about supported languages
type LanguageInfo struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	NativeName  string `json:"native_name"`
	IsSupported bool   `json:"is_supported"`
}

// GetLanguageInfo returns language information for a given code
func GetLanguageInfo(code string) LanguageInfo {
	supported := IsValidLanguage(code)

	info := LanguageInfo{
		Code:        code,
		Name:        LanguageNames[code],
		IsSupported: supported,
	}

	// Add native names
	switch code {
	case LanguageEnglish:
		info.NativeName = "English"
	case LanguageTamil:
		info.NativeName = "தமிழ்"
	case LanguageHindi:
		info.NativeName = "हिन्दी"
	}

	return info
}

// GetAllLanguageInfo returns information about all supported languages
func GetAllLanguageInfo() []LanguageInfo {
	result := make([]LanguageInfo, len(SupportedLanguages))
	for i, lang := range SupportedLanguages {
		result[i] = GetLanguageInfo(lang)
	}
	return result
}

// ============================================
// TRANSLATION RESPONSE WRAPPER
// ============================================

// TranslationResponse is a wrapper that includes translation metadata
type TranslationResponse struct {
	Language   string      `json:"language"`        // Language of response content
	Data       interface{} `json:"data"`            // Actual response data
	SourceLang string      `json:"source_language"` // Original language of user content
	Timestamp  int64       `json:"timestamp"`
}

// WrapWithTranslation wraps a response with translation metadata
func WrapWithTranslation(data interface{}, responseLanguage, sourceLanguage string) TranslationResponse {
	return TranslationResponse{
		Language:   responseLanguage,
		Data:       data,
		SourceLang: sourceLanguage,
		Timestamp:  0, // Will be set by caller
	}
}

// ============================================
// TRANSLATION DICTIONARY RESPONSES
// ============================================

// DictionaryEntry represents a single translation entry
type DictionaryEntry struct {
	Code    string `json:"code"`
	English string `json:"en"`
	Tamil   string `json:"ta"`
	Hindi   string `json:"hi"`
}

// GetStatusDictionary returns all status translations
func GetStatusDictionary() []DictionaryEntry {
	entries := make([]DictionaryEntry, 0)

	if englishMap, exists := StatusTranslations[LanguageEnglish]; exists {
		for code := range englishMap {
			entry := DictionaryEntry{
				Code:    code,
				English: StatusTranslations[LanguageEnglish][code],
			}
			if taMap, exists := StatusTranslations[LanguageTamil]; exists {
				entry.Tamil = taMap[code]
			}
			if hiMap, exists := StatusTranslations[LanguageHindi]; exists {
				entry.Hindi = hiMap[code]
			}
			entries = append(entries, entry)
		}
	}

	return entries
}

// GetJobRoleDictionary returns all job role translations
func GetJobRoleDictionary() []DictionaryEntry {
	entries := make([]DictionaryEntry, 0)

	if englishMap, exists := JobRoleTranslations[LanguageEnglish]; exists {
		for code := range englishMap {
			entry := DictionaryEntry{
				Code:    code,
				English: JobRoleTranslations[LanguageEnglish][code],
			}
			if taMap, exists := JobRoleTranslations[LanguageTamil]; exists {
				entry.Tamil = taMap[code]
			}
			if hiMap, exists := JobRoleTranslations[LanguageHindi]; exists {
				entry.Hindi = hiMap[code]
			}
			entries = append(entries, entry)
		}
	}

	return entries
}

// GetSalaryTypeDictionary returns all salary type translations
func GetSalaryTypeDictionary() []DictionaryEntry {
	entries := make([]DictionaryEntry, 0)

	if englishMap, exists := SalaryTypeTranslations[LanguageEnglish]; exists {
		for code := range englishMap {
			entry := DictionaryEntry{
				Code:    code,
				English: SalaryTypeTranslations[LanguageEnglish][code],
			}
			if taMap, exists := SalaryTypeTranslations[LanguageTamil]; exists {
				entry.Tamil = taMap[code]
			}
			if hiMap, exists := SalaryTypeTranslations[LanguageHindi]; exists {
				entry.Hindi = hiMap[code]
			}
			entries = append(entries, entry)
		}
	}

	return entries
}

// GetShiftTimingDictionary returns all shift timing translations
func GetShiftTimingDictionary() []DictionaryEntry {
	entries := make([]DictionaryEntry, 0)

	if englishMap, exists := ShiftTimingTranslations[LanguageEnglish]; exists {
		for code := range englishMap {
			entry := DictionaryEntry{
				Code:    code,
				English: ShiftTimingTranslations[LanguageEnglish][code],
			}
			if taMap, exists := ShiftTimingTranslations[LanguageTamil]; exists {
				entry.Tamil = taMap[code]
			}
			if hiMap, exists := ShiftTimingTranslations[LanguageHindi]; exists {
				entry.Hindi = hiMap[code]
			}
			entries = append(entries, entry)
		}
	}

	return entries
}

// GetEmploymentTypeDictionary returns all employment type translations
func GetEmploymentTypeDictionary() []DictionaryEntry {
	entries := make([]DictionaryEntry, 0)

	if englishMap, exists := EmploymentTypeTranslations[LanguageEnglish]; exists {
		for code := range englishMap {
			entry := DictionaryEntry{
				Code:    code,
				English: EmploymentTypeTranslations[LanguageEnglish][code],
			}
			if taMap, exists := EmploymentTypeTranslations[LanguageTamil]; exists {
				entry.Tamil = taMap[code]
			}
			if hiMap, exists := EmploymentTypeTranslations[LanguageHindi]; exists {
				entry.Hindi = hiMap[code]
			}
			entries = append(entries, entry)
		}
	}

	return entries
}

// GetBusinessTypeDictionary returns all business type translations
func GetBusinessTypeDictionary() []DictionaryEntry {
	entries := make([]DictionaryEntry, 0)

	if englishMap, exists := BusinessTypeTranslations[LanguageEnglish]; exists {
		for code := range englishMap {
			entry := DictionaryEntry{
				Code:    code,
				English: BusinessTypeTranslations[LanguageEnglish][code],
			}
			if taMap, exists := BusinessTypeTranslations[LanguageTamil]; exists {
				entry.Tamil = taMap[code]
			}
			if hiMap, exists := BusinessTypeTranslations[LanguageHindi]; exists {
				entry.Hindi = hiMap[code]
			}
			entries = append(entries, entry)
		}
	}

	return entries
}

// ============================================
// JSON MARSHALING HELPERS
// ============================================

// MarshalJSON ensures language_code is always lowercase
func MarshalLanguageCode(code string) ([]byte, error) {
	return json.Marshal(code)
}

// UnmarshalLanguageCode ensures language_code is always lowercase on input
func UnmarshalLanguageCode(data []byte) (string, error) {
	var code string
	if err := json.Unmarshal(data, &code); err != nil {
		return "", err
	}
	// Validation and normalization should be done in handlers
	return code, nil
}
