# Multilingual API Integration Guide

## Quick Start

Your Restaurant Naukri API now supports English, Tamil, and Hindi!

## 1. Language Detection

The backend automatically detects the user's preferred language from:

### Priority 1: Query Parameter
```
GET /api/v1/jobs?lang=ta
```

### Priority 2: Accept-Language Header
```
GET /api/v1/jobs
Accept-Language: hi
```

### Default
English (`en`) if not specified

## 2. API Introduction

### Supported Languages
| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English | English |
| `ta` | Tamil | தமிழ் |
| `hi` | Hindi | हिन्दी |

### What Gets Translated?
**Enum fields ONLY:**
- `job_role` - Job titles (Chef, Waiter, etc.)
- `status` - Status values (Open, Closed, etc.)
- `salary_type` - Salary types (Monthly, Daily, Hourly)
- `shift_timing` - Shift times (Morning, Evening, Night)
- `employment_type` - Employment types (Full Time, Part Time, etc.)
- `business_type` - Business types (Restaurant, Cafe, Hotel, etc.)

**User content is NOT translated:**
- `job_description` - Stored exactly as typed
- `company_description` - Stored exactly as typed
- `address` - Stored exactly as typed
- `bio` - Stored exactly as typed
- `notes` - Stored exactly as typed

## 3. API Endpoints

### Get All Jobs (Translated)
```http
GET /api/v1/jobs?lang=ta
```

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "job_role": "ஷெஃபு",          // ← TRANSLATED to Tamil
      "job_description": "We need an experienced chef...",  // ← ORIGINAL (NOT translated)
      "salary_type": "மாதிக",         // ← TRANSLATED to Tamil  
      "shift_timing": "மாலை",         // ← TRANSLATED to Tamil
      "employment_type": "முழு நேர",  // ← TRANSLATED to Tamil
      "status": "திறந்திருக்கும்",    // ← TRANSLATED to Tamil
      "language_code": "en",          // ← Original input language
      "created_at": "2024-02-17T10:00:00Z"
    }
  ],
  "count": 1,
  "language": "ta"                    // ← Response language used
}
```

### Get Single Job
```http
GET /api/v1/jobs/550e8400-e29b-41d4-a716-446655440000?lang=hi
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "job_role": "शेफ",                 // ← TRANSLATED to Hindi
  "job_description": "We need...",    // ← ORIGINAL (NOT translated)
  "salary_type": "मासिक",             // ← TRANSLATED
  "shift_timing": "शाम",              // ← TRANSLATED
  "employment_type": "पूर्णकालिक",    // ← TRANSLATED
  "status": "खुला",                   // ← TRANSLATED
  "language_code": "en"
}
```

### Create Job
```http
POST /api/v1/jobs
Content-Type: application/json

{
  "employer_id": "550e8400-e29b-41d4-a716-446655440001",
  "location_id": "550e8400-e29b-41d4-a716-446655440002",
  "job_title": "தலைமை பாச்சுறுப்பு",        // Unicode supported!
  "job_description": "நாங்கள் அனுபவமுள்ள...", // Tamil description
  "job_role": "chef",                      // Still English code
  "salary_type": "monthly",                // Still English code
  "shift_timing": "evening",               // Still English code
  "employment_type": "full_time",          // Still English code
  "salary_min": 25000,
  "salary_max": 35000,
  "number_of_openings": 2,
  "language_code": "ta"                    // Language preference
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655443333",
  "job_role": "ஷெஃபு",
  "job_description": "நாங்கள் அனுபவமுள்ள...",  // Preserved as typed
  "salary_type": "மாதிக",
  "shift_timing": "மாலை",
  "employment_type": "முழு நேர",
  "language_code": "ta"                            // Stored preference
}
```

### Get Translation Dictionary
Frontend can fetch all available translations for dropdown menus:

```http
GET /api/v1/translations?type=job_role
```

**Response:**
```json
{
  "data": [
    {
      "code": "chef",
      "en": "Chef",
      "ta": "ஷெஃபு",
      "hi": "शेफ"
    },
    {
      "code": "waiter",
      "en": "Waiter",
      "ta": "பரிமாறுபவர்",
      "hi": "वेटर"
    },
    {
      "code": "sous_chef",
      "en": "Sous Chef",
      "ta": "சஸ் ஷேஃபு",
      "hi": "सस शेफ"
    },
    ...
  ]
}
```

**Available types:**
- `job_role` - All job roles
- `status` - Job and application statuses
- `salary_type` - Salary types
- `shift_timing` - Shift timings
- `employment_type` - Employment types
- `business_type` - Business types
- `all` - All dictionaries (default if not specified)

### Get Supported Languages
```http
GET /api/v1/languages
```

**Response:**
```json
{
  "supported": [
    {
      "code": "en",
      "name": "English",
      "native_name": "English",
      "is_supported": true
    },
    {
      "code": "ta",
      "name": "Tamil",
      "native_name": "தமிழ்",
      "is_supported": true
    },
    {
      "code": "hi",
      "name": "Hindi",
      "native_name": "हिन्दी",
      "is_supported": true
    }
  ],
  "default": {
    "code": "en",
    "name": "English",
    "native_name": "English",
    "is_supported": true
  }
}
```

## 4. Implementation in JavaScript

### Set User Language Preference
```javascript
// Get from localStorage or user settings
const userLanguage = localStorage.getItem('language') || 'en';

// Set in all API calls
const fetchJobs = async (lang = userLanguage) => {
  const response = await fetch(`/api/v1/jobs?lang=${lang}`);
  const data = await response.json();
  return data;
};
```

### Using Accept-Language Header
```javascript
const fetchWithLanguage = async (url, lang = 'ta') => {
  const response = await fetch(url, {
    headers: {
      'Accept-Language': lang
    }
  });
  return response.json();
};

// Usage
const jobs = await fetchWithLanguage('/api/v1/jobs', 'hi');
```

### Display Translated Content
```javascript
const displayJob = (job, lang) => {
  return `
    <div class="job-card">
      <h3>${job.job_title}</h3>
      <p>Role: ${job.job_role}</p>                    <!-- Translated -->
      <p>Description: ${job.job_description}</p>      <!-- Original user input -->
      <p>Pay: ${job.salary_type}</p>                  <!-- Translated -->
      <p>Shift: ${job.shift_timing}</p>               <!-- Translated -->
      <p>Status: ${job.status}</p>                    <!-- Translated -->
    </div>
  `;
};
```

### Create Job in User's Language
```javascript
const createJob = async (jobData, lang = 'ta') => {
  const response = await fetch('/api/v1/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...jobData,
      job_role: 'chef',              // Still English code!
      salary_type: 'monthly',        // Still English code!
      shift_timing: 'evening',       // Still English code!
      language_code: lang            // User's language preference
    })
  });
  return response.json();
};

// Usage
await createJob({
  employer_id: '...',
  job_title: 'பாச்சுறுப்பு',
  job_description: 'நாங்கள் அனுபவமுள்ளது வேண்டுகிறோம்...',
}, 'ta');
```

### Populate Dropdowns with Translations
```javascript
const initializeJobRoleDropdown = async (selectElement, lang = 'en') => {
  const response = await fetch(`/api/v1/translations?type=job_role`);
  const { data } = await response.json();
  
  selectElement.innerHTML = '';
  data.forEach(role => {
    const option = document.createElement('option');
    option.value = role.code;                  // Always English code
    option.textContent = role[lang] || role.en; // Translated label
    selectElement.appendChild(option);
  });
};

// Usage
initializeJobRoleDropdown(
  document.getElementById('job-role-select'),
  'ta'  // Tamil labels
);
```

### Language Switcher
```javascript
const initializeLanguageSwitcher = async () => {
  // Get supported languages
  const response = await fetch('/api/v1/languages');
  const { supported } = await response.json();
  
  // Create dropdown
  const select = document.getElementById('language-select');
  supported.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = `${lang.name} (${lang.native_name})`;
    select.appendChild(option);
  });
  
  // Handle language change
  select.addEventListener('change', (e) => {
    localStorage.setItem('language', e.target.value);
    // Reload page or fetch new data
    location.reload();
  });
};
```

### Complete Example: Job Listing Page

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Jobs - Restaurant Naukri</title>
</head>
<body>
  <div class="header">
    <h1>Available Jobs</h1>
    <select id="lang-select">
      <option value="en">English</option>
      <option value="ta">தமிழ்</option>
      <option value="hi">हिन्दी</option>
    </select>
  </div>
  
  <div id="jobs-container"></div>
  
  <script>
    let currentLanguage = localStorage.getItem('language') || 'en';
    
    const fetchAndDisplay = async (lang) => {
      currentLanguage = lang;
      localStorage.setItem('language', lang);
      
      const response = await fetch(`/api/v1/jobs?lang=${lang}`);
      const { data } = await response.json();
      
      const html = data.map(job => `
        <div class="job-card">
          <h2>${job.job_title}</h2>
          <p><strong>Role:</strong> ${job.job_role}</p>
          <p><strong>Description:</strong> ${job.job_description}</p>
          <p><strong>Salary Type:</strong> ${job.salary_type}</p>
          <p><strong>Shift:</strong> ${job.shift_timing}</p>
          <p><strong>Type:</strong> ${job.employment_type}</p>
          <p><strong>Status:</strong> ${job.status}</p>
          <button onclick="applyJob('${job.id}')">Apply Now</button>
        </div>
      `).join('');
      
      document.getElementById('jobs-container').innerHTML = html;
    };
    
    // Initialize
    document.getElementById('lang-select').value = currentLanguage;
    document.getElementById('lang-select').addEventListener('change', (e) => {
      fetchAndDisplay(e.target.value);
    });
    
    fetchAndDisplay(currentLanguage);
  </script>
</body>
</html>
```

## 5. Error Handling

### Invalid Language Code
```javascript
try {
  const response = await fetch('/api/v1/jobs?lang=xyz');
  if (!response.ok) {
    console.error('Invalid language code');
    // Fallback to English
    return fetch('/api/v1/jobs?lang=en');
  }
} catch (error) {
  console.error('API Error:', error);
}
```

### Validation Rules
- Language code must be 2-5 characters
- Valid codes: `en`, `ta`, `hi`
- Invalid codes default to English
- Empty `language_code` defaults to English

### UTF-8 Support
All user-content fields (job_description, address, bio, etc.) support full UTF-8:

```javascript
const jobData = {
  job_title: '🍳 பாச்சுறுப்பு நிபுணர் 👨‍🍳',      // Emojis + Unicode supported!
  job_description: 'นอกจากนี้ยังสนับสนุน Thai!', // Multiple languages
  language_code: 'ta'
};
```

## 6. Performance Optimization

### Caching Strategy
```javascript
// Cache translations
const translationsCache = {};

const getTranslations = async (type = 'all') => {
  if (translationsCache[type]) {
    return translationsCache[type];
  }
  
  const response = await fetch(`/api/v1/translations?type=${type}`);
  const data = await response.json();
  translationsCache[type] = data;
  return data;
};
```

### Batch Requests
```javascript
// Request all translations at once instead of individual calls
const allTranslations = await fetch('/api/v1/translations?type=all');
```

## 7. Important Notes

### Enum Codes Always Stay English
```javascript
// ✅ Correct - submit English codes
POST /api/v1/jobs {
  "job_role": "chef",         // English code
  "salary_type": "monthly",   // English code
}

// ❌ Wrong - don't submit translated codes
POST /api/v1/jobs {
  "job_role": "ஷெஃபு",        // Wrong! Will cause error
  "salary_type": "மாதிக",     // Wrong! Will cause error
}
```

### User Content is Preserved
```javascript
// If user creates in Tamil, it's stored in Tamil
{
  "job_description": "தமிழ் உரை...",
  "language_code": "ta"
}

// No translation happens - it's stored exactly as typed
// Frontend will always get back the same Tamil text
```

### Always Include language_code on Create
```javascript
// ✅ Good - specify language preference
{
  "job_title": "Tamil title",
  "job_description": "Tamil description",
  "language_code": "ta"
}

// ⚠️ Allowed - defaults to English
{
  "job_title": "Title",
  // language_code omitted - defaults to "en"
}
```

## 8. Troubleshooting

### Getting untranslated responses?
1. Check query parameter: `?lang=ta`
2. Check Accept-Language header
3. Verify language code is valid (en/ta/hi)
4. Default is English if invalid

### User content appearing translated?
This shouldn't happen. User content is stored as-is. If you see translations, check that:
- The text wasn't pre-translated by frontend before sending
- Database language_code column exists (migration ran)
- Transform functions are being used in handlers

### Dropdown showing English even when lang=ta?
You need to fetch translations and display the label for requested language:

```javascript
// ❌ Wrong - always shows English
<option value="chef">${dict.en}</option>

// ✅ Correct - shows requested language
<option value="chef">${dict[requestedLang]}</option>
```

## 9. Next Steps

1. ✅ Backend multilingual system is ready
2. ✅ Migrations are created (run them)
3. ✅ Translation dictionaries available via API
4. Update frontend to use language parameter
5. Add language switcher UI
6. Test with each language (en, ta, hi)
7. Collect feedback and add more languages if needed

---

## Reference: All Translation Keys

### Job Roles
Chef, Sous Chef, Cook, Waiter, Waitress, Server, Captain, Bartender, Barista, Kitchen Helper, Dishwasher, Cashier, Receptionist, Restaurant Manager, Assistant Manager, Supervisor, Delivery Person, Housekeeping, Cleaner, Food Runner, Busboy, Host, Hostess

### Status Values
Open, Closed, Filled, Pending, Applied, Rejected, Interviewed, Selected, Offer Accepted

### Salary Types
Monthly, Daily, Hourly

### Shift Timings
Morning, Evening, Night, Rotational, Flexible, Split Shift

### Employment Types
Full Time, Part Time, Contract, Temporary, Internship

### Business Types
Restaurant, Cloud Kitchen, Hotel, Cafe, Bar, Catering, Food Court, Quick Service

---

For implementation help, see `IMPLEMENTATION_EXAMPLES.go` in the docs folder.
