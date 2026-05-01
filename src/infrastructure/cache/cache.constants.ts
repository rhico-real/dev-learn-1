export const CACHE_TTL = {
    FEED: 30,
    EVENT_LIST: 300,
    RACE_LIST: 600,
} as const;

export const CACHE_KEYS = {
    feed: (userId: string) => `runhop:feed:${userId}`,
    eventList: () => `runhop:events:list`,
    raceList: (eventId: string) => `runhop:events:${eventId}:races`,
} as const;
