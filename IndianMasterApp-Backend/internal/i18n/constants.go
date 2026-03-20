package i18n

// Language code constants
const (
	LanguageEnglish = "en"
	LanguageTamil   = "ta"
	LanguageHindi   = "hi"
)

// Supported languages
var SupportedLanguages = []string{
	LanguageEnglish,
	LanguageTamil,
	LanguageHindi,
}

// Language name display map
var LanguageNames = map[string]string{
	LanguageEnglish: "English",
	LanguageTamil:   "Tamil",
	LanguageHindi:   "Hindi",
}

// IsValidLanguage checks if the provided language code is supported
func IsValidLanguage(lang string) bool {
	for _, supported := range SupportedLanguages {
		if lang == supported {
			return true
		}
	}
	return false
}

// GetDefaultLanguage returns the default language (English)
func GetDefaultLanguage() string {
	return LanguageEnglish
}
