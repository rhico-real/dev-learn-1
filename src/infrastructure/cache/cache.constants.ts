export const CACHE_TTL = {
    FEED: 30,
    EVENT_LIST: 300,
    RACE_LIST: 600,
} as const;

function addCursorTake(base: string, cursor?: string, take?: number): string {
    // add cursor if present
    if (cursor != null) base += `:cursor=${cursor}`;

    // add take if present
    if (take != null) base += `:take=${take.toString()}`;

    return base;
}

export const CACHE_KEYS = {
    feed: (userId: string, cursor?: string, take?: number) =>
        addCursorTake(`runhop:feed:${userId}`, cursor, take),
    eventList: (cursor?: string, take?: number) =>
        addCursorTake('runhop:events:list', cursor, take),
    raceList: (eventId: string) => `runhop:events:${eventId}:races`,
} as const;
