export function FeedLoadingState() {
    return (
        <div className="feed-loading" aria-label="Loading feed">
            {[0, 1, 2].map((item) => (
                <article className="feed-post feed-post--skeleton" key={item}>
                    <div className="feed-skeleton feed-skeleton--meta" />
                    <div className="feed-skeleton feed-skeleton--headline" />
                    <div className="feed-skeleton feed-skeleton--body" />
                    <div className="feed-skeleton feed-skeleton--body feed-skeleton--body-short" />
                    <div className="feed-skeleton feed-skeleton--metrics" />
                </article>
            ))}
        </div>
    );
}

export function FeedEmptyState({
    activeTab,
    onResetFeed,
    onStartRaceDraft,
    sessionDisplayName,
}) {
    return (
        <article className="feed-empty">
            <p className="feed-label">Feed cleared</p>
            <h2>
                {activeTab === 'races'
                    ? 'No race or organizer posts are visible right now.'
                    : 'Your feed is quiet for the moment.'}
            </h2>
            <p>
                {sessionDisplayName}, this state is ready for the live `/feed`
                response. Reload if you want to fetch again, or post the first
                update from the composer.
            </p>
            <div className="feed-empty__actions">
                <button className="button button--primary" onClick={onResetFeed} type="button">
                    Reload feed
                </button>
                <button className="button button--ghost" onClick={onStartRaceDraft} type="button">
                    Add event
                </button>
            </div>
        </article>
    );
}
