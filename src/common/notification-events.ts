// export const NotificationEventTypes: Record<string, string> = {
//     POST_LIKE: 'social.post.liked',
//     POST_COMMENT: 'social.post.comment',

//     PAYMENT_APPROVED: 'payment.approved',
//     PAYMENT_REJECTED: 'payment.rejected',
// };

export const NotificationJobTypes = {
    POST_LIKE: 'POST_LIKE',
    POST_COMMENT: 'POST_COMMENT',
    FOLLOW: 'FOLLOW',
    PAYMENT_APPROVED: 'PAYMENT_APPROVED',
} as const;

export type NotificationJobType =
    (typeof NotificationJobTypes)[keyof typeof NotificationJobTypes];
