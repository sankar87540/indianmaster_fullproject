import { apiFetch } from './apiClient';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorkerProfilePayload {
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
    return apiFetch<WorkerProfileResponse>('/api/v1/worker/profile', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getWorkerProfile(): Promise<WorkerProfileResponse> {
    return apiFetch<WorkerProfileResponse>('/api/v1/worker/profile', {
        method: 'GET',
    });
}

export async function updateWorkerProfile(
    payload: WorkerProfilePayload,
): Promise<WorkerProfileResponse> {
    return apiFetch<WorkerProfileResponse>('/api/v1/worker/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function updateUserProfile(
    payload: UserProfilePayload,
): Promise<UserProfileResponse> {
    return apiFetch<UserProfileResponse>('/api/v1/user/profile', {
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
    return apiFetch<JobsFeedPage>(`/api/v1/jobs/feed?page=${page}&limit=${limit}`);
}

export interface ApplicationResponse {
    id: string;
    jobId: string;
    workerId: string;
    status: string;
}

export async function applyToJob(jobId: string): Promise<ApplicationResponse> {
    return apiFetch<ApplicationResponse>('/api/v1/applications', {
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
    return apiFetch<ApplicationsPage>(`/api/v1/applications/my-applications?page=${page}&limit=${limit}`);
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
    hirerName: string;
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
    return apiFetch<ChatThreadsPage>(`/api/v1/chat/threads?page=${page}&limit=${limit}`);
}

export async function getChatMessages(threadId: string, page = 1, limit = 50): Promise<ChatMessagesPage> {
    return apiFetch<ChatMessagesPage>(`/api/v1/chat/threads/${threadId}/messages?page=${page}&limit=${limit}`);
}

export async function sendChatMessage(threadId: string, messageText: string): Promise<ChatMessage> {
    return apiFetch<ChatMessage>(`/api/v1/chat/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ threadId, messageText }),
    });
}

export async function markThreadAsRead(threadId: string): Promise<void> {
    await apiFetch<null>(`/api/v1/chat/threads/${threadId}/read`, { method: 'PATCH' });
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

export async function submitInstantApplication(
    payload: InstantJobApplicationPayload,
): Promise<InstantJobApplicationResult> {
    return apiFetch<InstantJobApplicationResult>('/api/v1/worker/instant-apply', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
