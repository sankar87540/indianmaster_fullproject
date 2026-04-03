import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { apiFetch } from './apiClient';
import { ENDPOINTS } from './endpoints';
import { getAuthToken } from '../utils/storage';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorkerProfilePayload {
    fullName?: string;
    mobileNumber?: string;
    email?: string;
    selectedRoles?: string[];
    experienceYears?: number;
    businessTypes?: string[];
    jobCategories?: string[];
    jobRoles?: string[];
    languagesKnown?: string[];
    venuePreferences?: string[];
    workTypes?: string[];
    availability?: string[];
    availabilityStatus?: string;
    expectedSalaryMin?: number;
    expectedSalaryMax?: number;
    profilePhotoUrl?: string;
    language?: 'en' | 'hi' | 'ta';
    age?: number;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    isEducated?: boolean;
    educationLevel?: string;
    degree?: string;
    college?: string;
    aadhaarNumber?: string;
    liveLatitude?: number;
    liveLongitude?: number;
}

export interface WorkerProfileResponse {
    id: string;
    userId: string;
    phoneNumber: string;
    fullName: string;
    profilePhotoUrl: string;
    experienceYears: number;
    selectedRoles: string[];
    businessTypes: string[];
    jobCategories: string[];
    jobRoles: string[];
    languagesKnown: string[];
    venuePreferences: string[];
    workTypes: string[];
    availability: string[];
    availabilityStatus: string;
    expectedSalaryMin: number;
    expectedSalaryMax: number;
    completionPercentage: number;
    rating: number;
    totalReviews: number;
    age: number;
    gender: string;
    address: string;
    city: string;
    state: string;
    isEducated: boolean;
    educationLevel: string;
    degree: string;
    college: string;
    aadhaarNumber: string;
    language: string;
    isVerified: boolean;
    verificationStatus: string;
    liveLatitude: number | null;
    liveLongitude: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface UserProfilePayload {
    fullName?: string;
    email?: string;
    language?: 'en' | 'hi' | 'ta';
}

export interface UserProfileResponse {
    id: string;
    phoneNumber: string;
    fullName: string;
    email: string;
    role: string;
    language: string;
    isActive: boolean;
    createdAt: string;
}

// ── Service functions ────────────────────────────────────────────────────────

export async function createWorkerProfile(
    payload: WorkerProfilePayload,
): Promise<WorkerProfileResponse> {
    return apiFetch<WorkerProfileResponse>(ENDPOINTS.WORKER.PROFILE, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getWorkerProfile(): Promise<WorkerProfileResponse> {
    return apiFetch<WorkerProfileResponse>(ENDPOINTS.WORKER.PROFILE, {
        method: 'GET',
    });
}

export async function updateWorkerProfile(
    payload: WorkerProfilePayload,
): Promise<WorkerProfileResponse> {
    return apiFetch<WorkerProfileResponse>(ENDPOINTS.WORKER.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

/**
 * Upload a worker profile photo.
 *
 * Sends the image as multipart/form-data to POST /api/v1/worker/profile/photo.
 * The backend saves the file, updates workers.profile_photo_url, and returns
 * the full accessible URL.
 *
 * @param uri  - local file URI from expo-image-picker (file:///...)
 * @param mimeType - MIME type string, e.g. 'image/jpeg'
 * @returns the full URL of the stored photo (e.g. http://server/uploads/workers/.../photo.jpg)
 */
export async function uploadWorkerPhoto(uri: string, mimeType: string = 'image/jpeg'): Promise<string> {
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

    const formData = new FormData();
    // React Native FormData requires the { uri, name, type } shape
    formData.append('photo', { uri, name: `photo.${ext}`, type: mimeType } as any);

    const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
    const token = await getAuthToken();

    const response = await fetch(`${BASE_URL}${ENDPOINTS.WORKER.PROFILE_PHOTO}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        // Do NOT set Content-Type — let fetch set multipart/form-data with boundary
    });

    const body = await response.json();
    if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? body.message ?? 'Photo upload failed');
    }
    return body.data.url as string;
}

export interface WorkerResumeResponse {
    id: string;
    workerId: string;
    fileUrl: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    fileSize: number;
    isActive: boolean;
    uploadedAt: string;
}

/**
 * Upload a worker resume file.
 *
 * Sends the file as multipart/form-data to POST /api/v1/worker/profile/resume.
 * The backend deactivates any previous active resume for this worker, saves
 * the new file, inserts a row in worker_resumes (linked via worker_id), and
 * returns the resume metadata.
 *
 * Allowed types: PDF, DOC, DOCX. Max size: 10 MB.
 */
export async function uploadWorkerResume(
    uri: string,
    mimeType: string,
    fileName: string,
): Promise<WorkerResumeResponse> {
    const formData = new FormData();
    // React Native FormData requires the { uri, name, type } shape
    formData.append('resume', { uri, name: fileName, type: mimeType } as any);

    const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
    const token = await getAuthToken();

    const response = await fetch(`${BASE_URL}${ENDPOINTS.WORKER.PROFILE_RESUME}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        // Do NOT set Content-Type — let fetch set multipart/form-data with boundary
    });

    const body = await response.json();
    if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? body.message ?? 'Resume upload failed');
    }
    // The POST handler returns a partial gin.H{} — uploadedAt, storedName, and
    // isActive are not included. Normalise here so the caller always gets a
    // complete WorkerResumeResponse regardless of which endpoint was used.
    const data = body.data as Partial<WorkerResumeResponse> & Record<string, unknown>;
    return {
        id:           (data.id           as string)  ?? '',
        workerId:     (data.workerId     as string)  ?? '',
        fileUrl:      (data.fileUrl      as string)  ?? '',
        originalName: (data.originalName as string)  ?? fileName,
        storedName:   (data.storedName   as string)  ?? fileName,
        mimeType:     (data.mimeType     as string)  ?? mimeType,
        fileSize:     (data.fileSize     as number)  ?? 0,
        isActive:     (data.isActive     as boolean) ?? true,
        uploadedAt:   (data.uploadedAt   as string)  ?? new Date().toISOString(),
    };
}

/**
 * Fetch the active resume metadata for the authenticated worker.
 * Returns null if no resume has been uploaded yet.
 */
export async function getWorkerResume(): Promise<WorkerResumeResponse | null> {
    try {
        return await apiFetch<WorkerResumeResponse>(ENDPOINTS.WORKER.PROFILE_RESUME);
    } catch (e: any) {
        if (e?.statusCode === 404) return null;
        throw e;
    }
}

/**
 * Download and open a worker's resume file.
 *
 * Because the backend requires a valid JWT for document files (.pdf, .doc, .docx),
 * we cannot open the URL directly in a browser or with Linking.openURL — neither
 * sends an Authorization header. Instead we:
 *   1. Download the file to the device cache via FileSystem.downloadAsync,
 *      passing the Bearer token in the request headers.
 *   2. Open the cached file via Sharing.shareAsync, which invokes the OS-native
 *      document viewer (iOS QuickLook / Android intent chooser).
 */
export async function openWorkerResume(resume: WorkerResumeResponse): Promise<void> {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
    const url = resume.fileUrl.startsWith('http')
        ? resume.fileUrl
        : `${BASE_URL}${resume.fileUrl}`;

    // Use resume.id so repeated opens overwrite the same cache entry (no accumulation).
    const ext = (resume.storedName.split('.').pop() ?? 'pdf').toLowerCase();
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) throw new Error('File system cache directory is unavailable on this device');
    const localUri = `${cacheDir}resume_${resume.id}.${ext}`;

    const { status } = await FileSystem.downloadAsync(url, localUri, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (status !== 200) {
        throw new Error('Resume download failed');
    }

    await Sharing.shareAsync(localUri, {
        mimeType: resume.mimeType,
        dialogTitle: 'Open Resume',
    });
}

export async function updateUserProfile(
    payload: UserProfilePayload,
): Promise<UserProfileResponse> {
    return apiFetch<UserProfileResponse>(ENDPOINTS.USER.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export interface JobFeedItem {
    id: string;
    businessId: string;
    businessName: string;
    logoUrl: string;
    jobRole: string;
    position: string;
    categories: string[];
    roles: string[];
    preferredLanguages: string[];
    salaryMinAmount: number;
    salaryMaxAmount: number;
    experienceMin: number;
    experienceMax: number | null;
    vacancies: number;
    workingHours: number | null;
    weeklyLeaves: number;
    benefits: string[];
    workType: string;
    city: string;
    state: string;
    addressText: string;
    latitude: number | null;
    longitude: number | null;
    status: string;
    createdAt: string;
}

export interface JobsFeedPage {
    data: JobFeedItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export async function getJobsFeed(page = 1, limit = 20): Promise<JobsFeedPage> {
    return apiFetch<JobsFeedPage>(`${ENDPOINTS.JOBS.FEED}?page=${page}&limit=${limit}`);
}

export interface JobDetail extends JobFeedItem {
    locality: string;
    description: string;
    availability: string[];
    weeklyLeaves: number;
}

export async function getJobById(jobId: string): Promise<JobDetail> {
    return apiFetch<JobDetail>(ENDPOINTS.JOBS.BY_ID(jobId));
}

export interface ApplicationResponse {
    id: string;
    jobId: string;
    workerId: string;
    status: string;
}

export async function applyToJob(jobId: string): Promise<ApplicationResponse> {
    return apiFetch<ApplicationResponse>(ENDPOINTS.APPLICATIONS.ROOT, {
        method: 'POST',
        body: JSON.stringify({ jobId }),
    });
}

export interface ApplicationsPage {
    data: ApplicationResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export async function getMyApplications(page = 1, limit = 100): Promise<ApplicationsPage> {
    return apiFetch<ApplicationsPage>(`${ENDPOINTS.APPLICATIONS.MY_APPLICATIONS}?page=${page}&limit=${limit}`);
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatThread {
    id: string;
    workerId: string;
    hirerId: string;
    jobId: string;
    lastMessageAt: string | null;
    isArchived: boolean;
    unreadCount: number;
    // hirerName: context-aware display name.
    // For a worker, this is the hirer/business name.
    // For a hirer, this is the worker's name.
    hirerName: string;
    workerName: string;
    lastMessagePreview: string;
    createdAt: string;
}

export interface ChatThreadsPage {
    data: ChatThread[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ChatMessage {
    id: string;
    threadId: string;
    senderId: string;
    messageText: string;
    attachmentUrls: string[];
    isRead: boolean;
    readAt: string | null;
    deliveredAt: string | null;
    // Reply / quoted-reply context (null when not a reply)
    replyToMessageId: string | null;
    replyToText: string | null;
    replyToSenderId: string | null;
    createdAt: string;
}

export interface ChatMessagesPage {
    data: ChatMessage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export async function getChatThreads(page = 1, limit = 20): Promise<ChatThreadsPage> {
    // Timestamp param prevents iOS NSURLSession from serving a cached GET response on repeat polls.
    return apiFetch<ChatThreadsPage>(
        `${ENDPOINTS.CHAT.THREADS}?page=${page}&limit=${limit}&_t=${Date.now()}`,
        { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } },
    );
}

export async function getChatMessages(threadId: string, page = 1, limit = 50): Promise<ChatMessagesPage> {
    // Timestamp param prevents iOS NSURLSession from serving a cached GET response on repeat polls.
    return apiFetch<ChatMessagesPage>(
        `${ENDPOINTS.CHAT.THREAD_MESSAGES(threadId)}?page=${page}&limit=${limit}&_t=${Date.now()}`,
        { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } },
    );
}

export async function sendChatMessage(
    threadId: string,
    messageText: string,
    replyToMessageId?: string,
): Promise<ChatMessage> {
    const body: Record<string, string> = { messageText };
    if (replyToMessageId) body.replyToMessageId = replyToMessageId;
    return apiFetch<ChatMessage>(ENDPOINTS.CHAT.THREAD_MESSAGES(threadId), {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function markThreadAsRead(threadId: string): Promise<void> {
    await apiFetch<null>(ENDPOINTS.CHAT.THREAD_READ(threadId), { method: 'PATCH' });
}

/**
 * Open or retrieve a conversation with another user.
 * The backend determines the caller's role (WORKER or HIRER) from the JWT token
 * and assigns workerID/hirerID accordingly.
 *
 * @param otherUserId - The user_id of the other party
 * @param jobId       - Optional job context for the conversation
 */
export interface PresenceResponse {
    isOnline: boolean;
    lastSeen: string | null;
}

export async function getThreadPresence(threadId: string): Promise<PresenceResponse> {
    return apiFetch<PresenceResponse>(ENDPOINTS.CHAT.THREAD_PRESENCE(threadId));
}

export async function openChatThread(otherUserId: string, jobId?: string): Promise<ChatThread> {
    const payload: Record<string, string> = { otherUserId };
    if (jobId) payload.jobId = jobId;
    return apiFetch<ChatThread>(ENDPOINTS.CHAT.THREADS, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ── Hirer Profile ────────────────────────────────────────────────────────────

export interface HirerProfilePayload {
    businessName: string;
    ownerName: string;
    contactRole: string;
    businessTypes: string[];
    email?: string;
    mobileNumber?: string;
    fssaiLicense?: string;
    gstNumber?: string;
    employeeCount?: number;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
}

export interface HirerProfileResponse {
    id: string;
    ownerId: string;
    businessName: string;
    ownerName: string;
    contactRole: string;
    businessTypes: string[];
    email: string;
    mobileNumber: string;
    fssaiLicense: string;
    gstNumber: string;
    employeeCount: number;
    logoUrl: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Fetch the authenticated hirer's business profile.
 * Returns null if no profile has been created yet (404).
 */
export async function getHirerProfile(): Promise<HirerProfileResponse | null> {
    try {
        return await apiFetch<HirerProfileResponse>(ENDPOINTS.HIRER.PROFILE);
    } catch (e: any) {
        if (e?.statusCode === 404) return null;
        throw e;
    }
}

/**
 * Create or update the authenticated hirer's business profile.
 */
export async function upsertHirerProfile(payload: HirerProfilePayload): Promise<HirerProfileResponse> {
    return apiFetch<HirerProfileResponse>(ENDPOINTS.HIRER.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

/**
 * Fetch all active workers for the hirer's Explore screen.
 * Phone / email are stripped server-side — use unlockWorkerContact to get contact details.
 */
export async function listWorkersForHirer(): Promise<WorkerProfileResponse[]> {
    return apiFetch<WorkerProfileResponse[]>(ENDPOINTS.HIRER.WORKERS);
}

/**
 * Fetch a single worker's public profile (no contact details).
 */
export async function getWorkerProfileForHirer(workerId: string): Promise<WorkerProfileResponse> {
    return apiFetch<WorkerProfileResponse>(ENDPOINTS.HIRER.WORKER_PROFILE(workerId));
}

export interface WorkerUnlockStatusResponse {
    workerId: string;
    isUnlocked: boolean;
}

export interface WorkerContactResponse {
    workerId: string;
    phone: string;
    whatsappUrl: string;
    isUnlocked: boolean;
}

/**
 * Check whether the authenticated hirer has already unlocked a worker's contact.
 */
export async function checkWorkerUnlockStatus(workerId: string): Promise<WorkerUnlockStatusResponse> {
    return apiFetch<WorkerUnlockStatusResponse>(ENDPOINTS.HIRER.WORKER_UNLOCK_STATUS(workerId));
}

/**
 * Unlock a worker's contact details (requires active subscription).
 * Returns phone + WhatsApp deep-link.
 * Throws ApiError(402) if the hirer has no active subscription.
 */
export async function unlockWorkerContact(workerId: string): Promise<WorkerContactResponse> {
    return apiFetch<WorkerContactResponse>(ENDPOINTS.HIRER.WORKER_UNLOCK(workerId), {
        method: 'POST',
    });
}

// ── Hirer Job Posting ─────────────────────────────────────────────────────────

export interface CreateJobPayload {
    categories?: string[];
    roles?: string[];
    workType?: string;
    availability?: string[];
    preferredLanguages?: string[];
    city?: string;
    state?: string;
    locality?: string;
    experienceMin?: number;
    salaryMinAmount?: number;
    salaryMaxAmount?: number;
    vacancies?: number;
    maleVacancies?: number;
    femaleVacancies?: number;
    othersVacancies?: number;
    genderPreference?: string;
    weeklyLeaves?: number;
    workingHours?: number;
    description?: string;
    benefits?: string[];
}

export interface CreateJobResponse {
    id: string;
    businessId: string;
    jobRole: string;
    categories: string[];
    roles: string[];
    workType: string;
    availability: string[];
    preferredLanguages: string[];
    city: string;
    state: string;
    locality: string;
    experienceMin: number;
    salaryMinAmount: number;
    salaryMaxAmount: number;
    vacancies: number;
    weeklyLeaves: number;
    workingHours: number | null;
    description: string;
    benefits: string[];
    status: string;
    createdAt: string;
}

export async function createHirerJob(payload: CreateJobPayload): Promise<CreateJobResponse> {
    return apiFetch<CreateJobResponse>(ENDPOINTS.HIRER.JOBS, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export interface HirerJobsResponse {
    data: CreateJobResponse[];
    total: number;
}

export async function getMyHirerJobs(): Promise<HirerJobsResponse> {
    return apiFetch<HirerJobsResponse>(ENDPOINTS.HIRER.JOBS);
}

/**
 * Upload a hirer business logo.
 * Sends the image as multipart/form-data to POST /api/v1/hirer/profile/logo.
 * @returns the full URL of the stored logo
 */
export async function uploadHirerLogo(uri: string, mimeType: string = 'image/jpeg'): Promise<string> {
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

    const formData = new FormData();
    formData.append('logo', { uri, name: `logo.${ext}`, type: mimeType } as any);

    const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
    const token = await getAuthToken();

    const response = await fetch(`${BASE_URL}${ENDPOINTS.HIRER.PROFILE_LOGO}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });

    const body = await response.json();
    if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? body.message ?? 'Logo upload failed');
    }
    return body.data.url as string;
}

// ── Instant Job Application ───────────────────────────────────────────────────

export interface InstantJobApplicationPayload {
    name: string;
    phone: string;
    role: string;
    experience?: string;
    location?: string;
    companyName?: string;
}

export interface InstantJobApplicationResult {
    id: string;
    name: string;
    phone: string;
    role: string;
    experience: string;
    location: string;
    companyName: string;
    createdAt: string;
}

// ── Hirer Applicants ─────────────────────────────────────────────────────────

export interface ApplicantDetail {
    applicationId: string;
    status: string;
    appliedAt: string;
    workerUserId: string;
    fullName: string;
    phone: string;
    email: string;
    city: string;
    state: string;
    expectedSalaryMin: number;
    expectedSalaryMax: number;
    profilePhotoUrl: string;
}

export interface ApplicantsResponse {
    data: ApplicantDetail[];
    total: number;
}

export async function getJobApplicants(jobId: string): Promise<ApplicantsResponse> {
    return apiFetch<ApplicantsResponse>(ENDPOINTS.HIRER.JOB_APPLICANTS(jobId));
}

export async function updateHirerJob(jobId: string, payload: Partial<CreateJobPayload> & { status?: string }): Promise<CreateJobResponse> {
    return apiFetch<CreateJobResponse>(ENDPOINTS.HIRER.JOB_BY_ID(jobId), {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function deleteHirerJob(jobId: string): Promise<void> {
    return apiFetch<void>(ENDPOINTS.HIRER.JOB_BY_ID(jobId), {
        method: 'DELETE',
    });
}

export async function updateApplicationStatusByHirer(jobId: string, applicationId: string, status: string): Promise<void> {
    return apiFetch<void>(ENDPOINTS.HIRER.APPLICANT_STATUS(jobId, applicationId), {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
}

export async function submitInstantApplication(
    payload: InstantJobApplicationPayload,
): Promise<InstantJobApplicationResult> {
    return apiFetch<InstantJobApplicationResult>(ENDPOINTS.WORKER.INSTANT_APPLY, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
