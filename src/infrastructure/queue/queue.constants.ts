export const QUEUE_NAMES = {
    NOTIFICATION: 'notification-queue',
    REGISTRATION: 'registration-queue',
} as const;

export const NOTIFICATION_JOB = {
    CREATE: 'notification.create',
} as const;

export const REGISTRATION_JOB = {
    CONFIRM: 'registration.confirm',
};
