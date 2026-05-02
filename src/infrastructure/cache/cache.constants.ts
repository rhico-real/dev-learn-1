export const CACHE_TTL = {
    FEED: 30,
    EVENT_LIST: 300,
    RACE_LIST: 600,
} as const;

export const CACHE_KEYS = {
    feed: (userId: string) => `runhop:feed:${userId}`,
    eventList: (cursor?: string, take?: number) => {
        let str = 'runhop:events:list';

        // add cursor if present
        if (cursor != null) str += `:cursor=${cursor}`;

        // add take if present
        if (take != null) str += `:take=${take.toString()}`;

        return str;
    },
    raceList: (eventId: string) => `runhop:events:${eventId}:races`,
} as const;
