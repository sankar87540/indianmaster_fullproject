package i18n

// ============================================
// STATUS TRANSLATIONS
// ============================================

var StatusTranslations = map[string]map[string]string{
	LanguageEnglish: {
		"open":           "Open",
		"closed":         "Closed",
		"filled":         "Filled",
		"pending":        "Pending",
		"applied":        "Applied",
		"rejected":       "Rejected",
		"interviewed":    "Interviewed",
		"selected":       "Selected",
		"offer_accepted": "Offer Accepted",
	},
	LanguageTamil: {
		"open":           "திறந்திருக்கும்",
		"closed":         "மூடப்பட்டுள்ளது",
		"filled":         "நிரப்பப்பட்டது",
		"pending":        "நிலுவையில்",
		"applied":        "விண்ணப்பம் செய்யப்பட்டது",
		"rejected":       "நிராகரிக்கப்பட்டது",
		"interviewed":    "நேர்காணல் நடத்தப்பட்டது",
		"selected":       "தேர்ந்தெடுக்கப்பட்டது",
		"offer_accepted": "பயணம் ஏற்றுக்கொள்ளப்பட்டது",
	},
	LanguageHindi: {
		"open":           "खुला",
		"closed":         "बंद",
		"filled":         "भरा हुआ",
		"pending":        "लंबित",
		"applied":        "आवेदन किया गया",
		"rejected":       "अस्वीकार किया गया",
		"interviewed":    "साक्षात्कार लिया गया",
		"selected":       "चयनित",
		"offer_accepted": "प्रस्ताव स्वीकार किया गया",
	},
}

// ============================================
// JOB ROLE TRANSLATIONS
// ============================================

var JobRoleTranslations = map[string]map[string]string{
	LanguageEnglish: {
		"chef":               "Chef",
		"sous_chef":          "Sous Chef",
		"cook":               "Cook",
		"commis":             "Commis",
		"waiter":             "Waiter",
		"waitress":           "Waitress",
		"server":             "Server",
		"captain":            "Captain",
		"bartender":          "Bartender",
		"barista":            "Barista",
		"kitchen_helper":     "Kitchen Helper",
		"dishwasher":         "Dishwasher",
		"cashier":            "Cashier",
		"receptionist":       "Receptionist",
		"restaurant_manager": "Restaurant Manager",
		"assistant_manager":  "Assistant Manager",
		"supervisor":         "Supervisor",
		"delivery_person":    "Delivery Person",
		"delivery_executive": "Delivery Executive",
		"housekeeping":       "Housekeeping",
		"cleaner":            "Cleaner",
		"food_runner":        "Food Runner",
		"busboy":             "Busboy",
		"host":               "Host",
		"hostess":            "Hostess",
	},
	LanguageTamil: {
		"chef":               "শेফ",
		"sous_chef":          "சஸ் ஷேফ்",
		"cook":               "பாச்சுறுப்பு",
		"commis":             "கமிஸ்",
		"waiter":             "பரிமாறுபவர்",
		"waitress":           "பெண் பரிமாறுபவர்",
		"server":             "சேவையளிப்பவர்",
		"captain":            "கேப்டன்",
		"bartender":          "பார்டெண்டர்",
		"barista":            "பரிஸ்தா",
		"kitchen_helper":     "சமையல் உதவியாளர்",
		"dishwasher":         "பாத்திரம் கழுவவும்",
		"cashier":            "காசியர்",
		"receptionist":       "வரவேற்பாளர்",
		"restaurant_manager": "உணவகத் தலைவர்",
		"assistant_manager":  "உதவி தலைவர்",
		"supervisor":         "மேற்பார்வையாளர்",
		"delivery_person":    "வழங்குபவர்",
		"delivery_executive": "வழங்கல் நிர்வாহி",
		"housekeeping":       "வீட்டுத் தொழிலாளி",
		"cleaner":            "சுத்தம் செய்பவர்",
		"food_runner":        "உணவு ஓடுபவர்",
		"busboy":             "பணியாளர் பையன்",
		"host":               "ஹோஸ்ட்",
		"hostess":            "விருந்தோம்பலிபும",
	},
	LanguageHindi: {
		"chef":               "शेफ",
		"sous_chef":          "सस शेफ",
		"cook":               "रसोइया",
		"commis":             "कमिस",
		"waiter":             "वेटर",
		"waitress":           "वेट्रेस",
		"server":             "सर्वर",
		"captain":            "कप्तान",
		"bartender":          "बारटेंडर",
		"barista":            "बरिस्ता",
		"kitchen_helper":     "रसोई सहायक",
		"dishwasher":         "बर्तन धोने वाला",
		"cashier":            "कैशियर",
		"receptionist":       "रिसेप्शनिस्ट",
		"restaurant_manager": "रेस्तरां प्रबंधक",
		"assistant_manager":  "सहायक प्रबंधक",
		"supervisor":         "पर्यवेक्षक",
		"delivery_person":    "डिलीवरी व्यक्ति",
		"delivery_executive": "डिलीवरी कार्यकारी",
		"housekeeping":       "हाउसकीपिंग",
		"cleaner":            "सफाई कर्मचारी",
		"food_runner":        "खाना भागने वाला",
		"busboy":             "बॉय",
		"host":               "होस्ट",
		"hostess":            "होस्टेस",
	},
}

// ============================================
// SALARY TYPE TRANSLATIONS
// ============================================

var SalaryTypeTranslations = map[string]map[string]string{
	LanguageEnglish: {
		"monthly": "Monthly",
		"daily":   "Daily",
		"hourly":  "Hourly",
	},
	LanguageTamil: {
		"monthly": "மாதிக",
		"daily":   "தினசரி",
		"hourly":  "மணிநேரம்",
	},
	LanguageHindi: {
		"monthly": "मासिक",
		"daily":   "दैनिक",
		"hourly":  "प्रति घंटा",
	},
}

// ============================================
// SHIFT TIMING TRANSLATIONS
// ============================================

var ShiftTimingTranslations = map[string]map[string]string{
	LanguageEnglish: {
		"morning":    "Morning",
		"evening":    "Evening",
		"night":      "Night",
		"rotational": "Rotational",
		"flexible":   "Flexible",
		"split":      "Split Shift",
	},
	LanguageTamil: {
		"morning":    "காலை",
		"evening":    "மாலை",
		"night":      "இரவு",
		"rotational": "சுழல் மாறும்",
		"flexible":   "நெகிழ்ச்சிமான",
		"split":      "பிரிந்த மாற்று",
	},
	LanguageHindi: {
		"morning":    "सुबह",
		"evening":    "शाम",
		"night":      "रात",
		"rotational": "रोटेशनल",
		"flexible":   "लचीला",
		"split":      "विभाजित पारी",
	},
}

// ============================================
// EMPLOYMENT TYPE TRANSLATIONS
// ============================================

var EmploymentTypeTranslations = map[string]map[string]string{
	LanguageEnglish: {
		"full_time":  "Full Time",
		"part_time":  "Part Time",
		"contract":   "Contract",
		"temporary":  "Temporary",
		"internship": "Internship",
	},
	LanguageTamil: {
		"full_time":  "முழு நேர",
		"part_time":  "பகுதி நேர",
		"contract":   "ஒப்பந்தம்",
		"temporary":  "தற்காலிக",
		"internship": "பயிற்சி",
	},
	LanguageHindi: {
		"full_time":  "पूर्णकालिक",
		"part_time":  "अंशकालिक",
		"contract":   "अनुबंध",
		"temporary":  "अस्थायी",
		"internship": "इंटर्नशिप",
	},
}

// ============================================
// BUSINESS TYPE TRANSLATIONS
// ============================================

var BusinessTypeTranslations = map[string]map[string]string{
	LanguageEnglish: {
		"restaurant":    "Restaurant",
		"cloud_kitchen": "Cloud Kitchen",
		"hotel":         "Hotel",
		"cafe":          "Cafe",
		"bar":           "Bar",
		"catering":      "Catering",
		"food_court":    "Food Court",
		"quick_service": "Quick Service",
	},
	LanguageTamil: {
		"restaurant":    "உணவகம்",
		"cloud_kitchen": "கிளவுட் சமையல் அறை",
		"hotel":         "ஹோட்டல்",
		"cafe":          "கஹுவா",
		"bar":           "பாறு",
		"catering":      "உணவு வழங்கல்",
		"food_court":    "உணவு நீதிமன்றம்",
		"quick_service": "விரைவு சேவை",
	},
	LanguageHindi: {
		"restaurant":    "रेस्तरां",
		"cloud_kitchen": "क्लाउड रसोई",
		"hotel":         "होटल",
		"cafe":          "कैफे",
		"bar":           "बार",
		"catering":      "खान-पान",
		"food_court":    "खाद्य न्यायालय",
		"quick_service": "त्वरित सेवा",
	},
}

// ============================================
// TRANSLATE FUNCTION - GENERIC
// ============================================

// Translate returns the translated value for a given enum in the requested language
// If translation doesn't exist, returns the original code in English
func Translate(translationMap map[string]map[string]string, code, lang string) string {
	if !IsValidLanguage(lang) {
		lang = GetDefaultLanguage()
	}

	// Get translation for the language
	if langMap, exists := translationMap[lang]; exists {
		if translated, exists := langMap[code]; exists {
			return translated
		}
	}

	// Fallback to English
	if englishMap, exists := translationMap[LanguageEnglish]; exists {
		if translated, exists := englishMap[code]; exists {
			return translated
		}
	}

	// If no translation found, return the original code
	return code
}

// TranslateStatus translates a job or application status
func TranslateStatus(status, lang string) string {
	return Translate(StatusTranslations, status, lang)
}

// TranslateJobRole translates a job role
func TranslateJobRole(role, lang string) string {
	return Translate(JobRoleTranslations, role, lang)
}

// TranslateSalaryType translates a salary type
func TranslateSalaryType(salaryType, lang string) string {
	return Translate(SalaryTypeTranslations, salaryType, lang)
}

// TranslateShiftTiming translates a shift timing
func TranslateShiftTiming(timing, lang string) string {
	return Translate(ShiftTimingTranslations, timing, lang)
}

// TranslateEmploymentType translates an employment type
func TranslateEmploymentType(empType, lang string) string {
	return Translate(EmploymentTypeTranslations, empType, lang)
}

// TranslateBusinessType translates a business type
func TranslateBusinessType(bizType, lang string) string {
	return Translate(BusinessTypeTranslations, bizType, lang)
}
