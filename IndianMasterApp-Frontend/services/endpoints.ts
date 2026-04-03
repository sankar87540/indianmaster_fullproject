// ── Centralized API Endpoint Paths ───────────────────────────────────────────
//
// All backend route strings live here. Service files must import from this
// module instead of embedding raw path strings.
//
// Convention:
//   - Static paths  → plain string constant
//   - Dynamic paths → inline arrow function returning a string
//
// Base prefix /api/v1 is included in every entry so callers never construct
// partial paths.

export const ENDPOINTS = {

    // ── Auth ─────────────────────────────────────────────────────────────────
    AUTH: {
        SEND_OTP:   '/api/v1/auth/send-otp',
        VERIFY_OTP: '/api/v1/auth/verify-otp',
    },

    // ── User (shared across roles) ────────────────────────────────────────────
    USER: {
        PROFILE:    '/api/v1/user/profile',
        PUSH_TOKEN: '/api/v1/user/push-token',
    },

    // ── Worker ────────────────────────────────────────────────────────────────
    WORKER: {
        PROFILE:        '/api/v1/worker/profile',
        PROFILE_PHOTO:  '/api/v1/worker/profile/photo',
        PROFILE_RESUME: '/api/v1/worker/profile/resume',
        INSTANT_APPLY:  '/api/v1/worker/instant-apply',
    },

    // ── Jobs ─────────────────────────────────────────────────────────────────
    JOBS: {
        FEED:  '/api/v1/jobs/feed',
        BY_ID: (jobId: string) => `/api/v1/jobs/${jobId}`,
    },

    // ── Applications ──────────────────────────────────────────────────────────
    APPLICATIONS: {
        ROOT:            '/api/v1/applications',
        MY_APPLICATIONS: '/api/v1/applications/my-applications',
    },

    // ── Chat ─────────────────────────────────────────────────────────────────
    CHAT: {
        THREADS:          '/api/v1/chat/threads',
        THREAD_MESSAGES:  (threadId: string) => `/api/v1/chat/threads/${threadId}/messages`,
        THREAD_READ:      (threadId: string) => `/api/v1/chat/threads/${threadId}/read`,
        THREAD_PRESENCE:  (threadId: string) => `/api/v1/chat/threads/${threadId}/presence`,
        WS:               '/api/v1/chat/ws',
    },

    // ── Hirer ─────────────────────────────────────────────────────────────────
    HIRER: {
        PROFILE:              '/api/v1/hirer/profile',
        PROFILE_LOGO:         '/api/v1/hirer/profile/logo',
        WORKERS:              '/api/v1/hirer/workers',
        WORKER_PROFILE:       (workerId: string) => `/api/v1/hirer/workers/${workerId}/profile`,
        WORKER_UNLOCK_STATUS: (workerId: string) => `/api/v1/hirer/workers/${workerId}/unlock-status`,
        WORKER_UNLOCK:        (workerId: string) => `/api/v1/hirer/workers/${workerId}/unlock`,
        JOBS:                 '/api/v1/hirer/jobs',
        JOB_BY_ID:            (jobId: string) => `/api/v1/hirer/jobs/${jobId}`,
        JOB_APPLICANTS:       (jobId: string) => `/api/v1/hirer/jobs/${jobId}/applicants`,
        APPLICANT_STATUS:     (jobId: string, applicationId: string) =>
                                  `/api/v1/hirer/jobs/${jobId}/applicants/${applicationId}/status`,
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    NOTIFICATIONS: {
        ROOT:         '/api/v1/notifications',
        UNREAD_COUNT: '/api/v1/notifications/unread/count',
        MARK_READ:    (notificationId: string) => `/api/v1/notifications/${notificationId}/read`,
    },

} as const;
