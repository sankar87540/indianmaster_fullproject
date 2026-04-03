import { WorkerProfilePayload } from '@/services/workerService';

/**
 * Raw profile shape accumulated across onboarding screens in AsyncStorage.
 *
 * Every field is optional because screens are traversed independently and
 * the object is built up incrementally via saveProfileData / getProfileData.
 */
export interface RawWorkerProfile {
    // Personal (educated-setup / uneducated-setup / profile-details)
    fullName?: string;
    age?: string | number;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    isEducated?: boolean;

    // Education (profile-setup / profile-details)
    educationLevel?: string;  // e.g. "10th Pass", "Graduate"
    degree?: string;          // e.g. "BE Computer Science"
    college?: string;         // e.g. "Anna University"
    education?: string;       // legacy combined string, not sent to backend

    // Professional (profile-setup / profile-details)
    selectedRoles?: string[];
    businessTypes?: string[];
    selectedJobCategories?: string[]; // mapped → jobCategories
    languagesKnown?: string[];
    venuePreferences?: string[];
    workTypes?: string[];
    availability?: string[];
    availabilityStatus?: string;

    // Experience — two possible shapes:
    //   profile-setup stores: selectedExperience: ["2-5 years"] | ["3"]
    //   profile-details stores: experience: "2" (plain number string)
    selectedExperience?: string[];
    experience?: string;

    // Salary — profile-setup stores a single parsed integer
    expectedSalary?: number;
    // If screens ever split into min/max these take precedence
    expectedSalaryMin?: number;
    expectedSalaryMax?: number;

    // Verification (profile-details)
    aadhaarNumber?: string;

    // GPS coordinates — captured silently via device location on profile save
    liveLatitude?: number;
    liveLongitude?: number;

    // Identity fields sent to both worker profile and user profile endpoints
    mobileNumber?: string;
    email?: string;
    completionPercentage?: string | number;
    profilePhotoUrl?: string;
    language?: 'en' | 'hi' | 'ta';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts experience strings to an integer year count.
 *
 * Handles:
 *   "2-5 years"  → 2   (lower bound of range)
 *   "5+ years"   → 5
 *   "0-1 year"   → 0
 *   "3"          → 3   (plain number string from profile-details)
 *   3            → 3   (already a number)
 */
export function parseExperienceYears(raw: string | number | undefined): number {
    if (raw === undefined || raw === null || raw === '') return 0;
    if (typeof raw === 'number') return Math.max(0, Math.floor(raw));
    // Extract the first integer from the string
    const match = raw.match(/\d+/);
    if (!match) return 0;
    return Math.max(0, parseInt(match[0], 10));
}

/**
 * Converts age stored as a string ("25") or number to a number.
 */
export function parseAge(raw: string | number | undefined): number {
    if (raw === undefined || raw === null || raw === '') return 0;
    if (typeof raw === 'number') return Math.max(0, Math.floor(raw));
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

// ── Mapper ───────────────────────────────────────────────────────────────────

/**
 * Converts the raw AsyncStorage worker profile object into the shape
 * expected by POST /api/v1/worker/profile and PUT /api/v1/worker/profile.
 *
 * Usable for both create and update — only fields with meaningful values
 * are included so partial updates don't overwrite existing backend data
 * with empty defaults.
 */
export function mapToWorkerProfilePayload(raw: RawWorkerProfile): WorkerProfilePayload {
    const payload: WorkerProfilePayload = {};

    // ── Identity (fullName, mobileNumber, email) ─────────────────────────────
    if (raw.fullName && raw.fullName.trim()) payload.fullName = raw.fullName.trim();
    if (raw.mobileNumber && raw.mobileNumber.trim()) payload.mobileNumber = raw.mobileNumber.trim();
    if (raw.email && raw.email.trim()) payload.email = raw.email.trim();

    // ── Personal ────────────────────────────────────────────────────────────
    if (raw.age !== undefined && raw.age !== '') {
        payload.age = parseAge(raw.age);
    }
    if (raw.gender) payload.gender = raw.gender;
    if (raw.address) payload.address = raw.address;
    if (raw.city) payload.city = raw.city;
    if (raw.state) payload.state = raw.state;
    if (raw.isEducated !== undefined) payload.isEducated = raw.isEducated;

    // ── Education ───────────────────────────────────────────────────────────
    if (raw.educationLevel) payload.educationLevel = raw.educationLevel;
    if (raw.degree) payload.degree = raw.degree;
    if (raw.college) payload.college = raw.college;

    // ── Professional arrays ──────────────────────────────────────────────────
    if (raw.selectedRoles && raw.selectedRoles.length > 0) {
        payload.selectedRoles = raw.selectedRoles;
    }
    if (raw.businessTypes && raw.businessTypes.length > 0) {
        payload.businessTypes = raw.businessTypes;
    }
    // selectedJobCategories (frontend name) → jobCategories (backend name)
    if (raw.selectedJobCategories && raw.selectedJobCategories.length > 0) {
        payload.jobCategories = raw.selectedJobCategories;
    }
    if (raw.languagesKnown && raw.languagesKnown.length > 0) {
        payload.languagesKnown = raw.languagesKnown;
    }
    if (raw.venuePreferences && raw.venuePreferences.length > 0) {
        payload.venuePreferences = raw.venuePreferences;
    }
    if (raw.workTypes && raw.workTypes.length > 0) {
        payload.workTypes = raw.workTypes;
    }
    if (raw.availability && raw.availability.length > 0) {
        payload.availability = raw.availability;
    }
    if (raw.availabilityStatus) payload.availabilityStatus = raw.availabilityStatus;

    // ── Experience ───────────────────────────────────────────────────────────
    // selectedExperience takes precedence (set during onboarding);
    // fall back to the plain experience string from profile-details.
    const experienceSource =
        raw.selectedExperience?.[0] ?? raw.experience ?? undefined;
    if (experienceSource !== undefined) {
        payload.experienceYears = parseExperienceYears(experienceSource);
    }

    // ── Salary ───────────────────────────────────────────────────────────────
    // If explicit min/max already exist (future split-field screens), use them.
    // Otherwise map the single expectedSalary to both min and max.
    if (raw.expectedSalaryMin !== undefined || raw.expectedSalaryMax !== undefined) {
        if (raw.expectedSalaryMin !== undefined) payload.expectedSalaryMin = raw.expectedSalaryMin;
        if (raw.expectedSalaryMax !== undefined) payload.expectedSalaryMax = raw.expectedSalaryMax;
    } else if (raw.expectedSalary !== undefined && raw.expectedSalary > 0) {
        payload.expectedSalaryMin = raw.expectedSalary;
        payload.expectedSalaryMax = raw.expectedSalary;
    }

    // ── Identity ─────────────────────────────────────────────────────────────
    if (raw.aadhaarNumber && raw.aadhaarNumber.length === 12) {
        payload.aadhaarNumber = raw.aadhaarNumber;
    }

    // ── App / language ───────────────────────────────────────────────────────
    if (raw.profilePhotoUrl) payload.profilePhotoUrl = raw.profilePhotoUrl;
    if (raw.language) payload.language = raw.language;

    // ── GPS coordinates ───────────────────────────────────────────────────────
    if (raw.liveLatitude != null) payload.liveLatitude = raw.liveLatitude;
    if (raw.liveLongitude != null) payload.liveLongitude = raw.liveLongitude;

    return payload;
}
