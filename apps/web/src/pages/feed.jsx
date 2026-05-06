import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeedEmptyState, FeedLoadingState } from '../components/FeedStates';
import { SiteFrame } from '../components/SiteFrame';
import {
    feedNavigation,
    feedTabs,
    initialFeedPosts,
    trendingRaces,
} from '../data/runhopContent';
import {
    createComment,
    createPost,
    followUser,
    likePost,
    listComments,
    listFeed,
    unlikePost,
} from '../lib/socialApi';
import { formatRelativeTime } from '../lib/formatters';
import {
    CommunityCenter,
    ExploreCenter,
    MerchCenter,
} from './public';

function normalizeFeedPost(post) {
    const author = post?.author && typeof post.author === 'object' ? post.author : {};
    const counts =
        post?.counts && typeof post.counts === 'object' ? post.counts : {};
    const createdAt = post?.createdAt || post?.time || new Date().toISOString();
    const content =
        typeof post?.content === 'string' && post.content.trim()
            ? post.content.trim()
            : typeof post?.body === 'string' && post.body.trim()
              ? post.body.trim()
              : typeof post?.headline === 'string' && post.headline.trim()
                ? post.headline.trim()
                : '';

    return {
        id:
            typeof post?.id === 'string' && post.id.trim()
                ? post.id.trim()
                : `post-${Date.now()}`,
        content,
        author: {
            id:
                typeof author.id === 'string' && author.id.trim()
                    ? author.id.trim()
                    : typeof post?.authorId === 'string'
                      ? post.authorId
                      : `author-${Date.now()}`,
            displayName:
                typeof author.displayName === 'string' && author.displayName.trim()
                    ? author.displayName.trim()
                    : typeof post?.author === 'string' && post.author.trim()
                      ? post.author.trim()
                      : 'RunHop member',
            avatar:
                typeof author.avatar === 'string' && author.avatar.trim()
                    ? author.avatar.trim()
                    : '',
        },
        createdAt,
        counts: {
            likes:
                Number.isFinite(counts.likes) && counts.likes >= 0
                    ? counts.likes
                    : Number.isFinite(post?.metrics?.boosts)
                      ? post.metrics.boosts
                      : 0,
            comments:
                Number.isFinite(counts.comments) && counts.comments >= 0
                    ? counts.comments
                    : Number.isFinite(post?.metrics?.replies)
                      ? post.metrics.replies
                      : 0,
        },
        likedByMe: Boolean(post?.likedByMe),
        likeId:
            typeof post?.likeId === 'string' && post.likeId.trim()
                ? post.likeId.trim()
                : '',
        isFresh: Boolean(post?.isFresh),
    };
}

function normalizeSampleFeedPost(post) {
    return normalizeFeedPost({
        id: post.id,
        content: post.body || post.headline || '',
        author: {
            id: post.id,
            displayName: post.author,
            avatar: '',
        },
        createdAt: new Date(Date.now() - 1000 * 60 * (parseInt(post.time, 10) || 12)).toISOString(),
        counts: {
            likes: post.metrics?.boosts || 0,
            comments: post.metrics?.replies || 0,
        },
        likedByMe: false,
    });
}

function normalizeComment(comment, currentUser = null) {
    const author = comment?.author && typeof comment.author === 'object' ? comment.author : {};

    return {
        id:
            typeof comment?.id === 'string' && comment.id.trim()
                ? comment.id.trim()
                : `comment-${Date.now()}`,
        content:
            typeof comment?.content === 'string' ? comment.content.trim() : '',
        authorName:
            typeof author.displayName === 'string' && author.displayName.trim()
                ? author.displayName.trim()
                : typeof comment?.authorName === 'string' && comment.authorName.trim()
                  ? comment.authorName.trim()
                  : currentUser?.displayName || 'Member',
        avatar:
            typeof author.avatar === 'string' && author.avatar.trim()
                ? author.avatar.trim()
                : currentUser?.avatar || '',
        createdAt:
            typeof comment?.createdAt === 'string' && comment.createdAt.trim()
                ? comment.createdAt.trim()
                : new Date().toISOString(),
    };
}

function getPostContentLabel(post) {
    return post.content;
}

function PostAvatar({ avatar, name }) {
    const initials = name
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return avatar ? (
        <img className="feed-post__avatar" src={avatar} alt="" aria-hidden="true" />
    ) : (
        <div className="feed-post__avatar feed-post__avatar--fallback" aria-hidden="true">
            {initials}
        </div>
    );
}

function FeedPostCard({
    currentUser,
    post,
    onCommentCreated,
    onLikePost,
    onFollowUser,
}) {
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowPending, setIsFollowPending] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentsCursor, setCommentsCursor] = useState('');
    const [hasMoreComments, setHasMoreComments] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [commentDraft, setCommentDraft] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isLikeAnimating, setIsLikeAnimating] = useState(false);
    const [isFreshVisible, setIsFreshVisible] = useState(Boolean(post.isFresh));
    const hasLoadedInitialCommentsRef = useRef(false);
    const likeAnimationTimerRef = useRef(null);

    useEffect(() => {
        if (!post.isFresh) {
            setIsFreshVisible(false);
            return undefined;
        }

        setIsFreshVisible(true);

        const timerId = window.setTimeout(() => {
            setIsFreshVisible(false);
        }, 720);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [post.isFresh]);

    useEffect(
        () => () => {
            if (likeAnimationTimerRef.current) {
                window.clearTimeout(likeAnimationTimerRef.current);
            }
        },
        [],
    );

    const loadComments = async (cursor = '') => {
        setIsLoadingComments(true);

        try {
            const response = await listComments(
                currentUser.accessToken,
                post.id,
                cursor ? { cursor, limit: 10 } : { limit: 10 },
            );

            const nextComments = response.data.map((comment) =>
                normalizeComment(comment, currentUser.user),
            );

            setComments((currentComments) =>
                cursor ? [...currentComments, ...nextComments] : nextComments,
            );
            setCommentsCursor(typeof response.meta?.cursor === 'string' ? response.meta.cursor : '');
            setHasMoreComments(nextComments.length === 10);
            if (!cursor) {
                hasLoadedInitialCommentsRef.current = true;
            }
        } catch {
            setHasMoreComments(false);
            if (!cursor) {
                hasLoadedInitialCommentsRef.current = true;
            }
        } finally {
            setIsLoadingComments(false);
        }
    };

    useEffect(() => {
        if (
            isCommentsOpen &&
            comments.length === 0 &&
            !isLoadingComments &&
            !hasLoadedInitialCommentsRef.current
        ) {
            void loadComments();
        }
    }, [comments.length, isCommentsOpen, isLoadingComments]);

    const visibleComments = isExpanded ? comments : comments.slice(0, 5);

    const handleFollow = async () => {
        if (isFollowing || isFollowPending) {
            return;
        }

        setIsFollowPending(true);

        try {
            await onFollowUser(post.author.id);
            setIsFollowing(true);
        } catch {
            setIsFollowing(false);
        } finally {
            setIsFollowPending(false);
        }
    };

    const handleLike = async () => {
        setIsLikeAnimating(true);

        if (likeAnimationTimerRef.current) {
            window.clearTimeout(likeAnimationTimerRef.current);
        }

        likeAnimationTimerRef.current = window.setTimeout(() => {
            setIsLikeAnimating(false);
        }, 420);

        await onLikePost(post.id);
    };

    const handleCommentSubmit = async () => {
        const trimmedDraft = commentDraft.trim();

        if (!trimmedDraft || isSubmittingComment) {
            return;
        }

        setIsSubmittingComment(true);

        try {
            const createdComment = await createComment(
                currentUser.accessToken,
                post.id,
                trimmedDraft,
            );

            const normalizedComment = normalizeComment(
                createdComment,
                currentUser.user,
            );

            setComments((currentComments) => [
                ...currentComments,
                {
                    ...normalizedComment,
                    isFresh: true,
                },
            ]);
            hasLoadedInitialCommentsRef.current = true;
            setCommentDraft('');
            setIsExpanded(true);
            onCommentCreated(post.id, normalizedComment);
        } finally {
            setIsSubmittingComment(false);
            if (!isCommentsOpen) {
                setIsCommentsOpen(true);
            }
        }
    };

    const handleCommentKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void handleCommentSubmit();
        }
    };

    const handleToggleCommentView = async () => {
        if (!isCommentsOpen) {
            setIsCommentsOpen(true);
            return;
        }

        if (!isExpanded && comments.length > 5) {
            setIsExpanded(true);
            return;
        }

        if (isExpanded && hasMoreComments && commentsCursor) {
            await loadComments(commentsCursor);
        }
    };

    const followLabel = isFollowing ? 'Following' : 'Follow';
    const showLoadAllComments = comments.length > 5 && !isExpanded;
    const showLoadMoreComments = isExpanded && hasMoreComments;
    const shouldShowComments = isCommentsOpen;
    const postIsFresh = isFreshVisible;

    return (
        <article
            className={[
                'feed-post',
                post.likedByMe ? 'feed-post--liked' : '',
                postIsFresh ? 'feed-post--fresh' : '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <div className="feed-post__meta">
                <div className="feed-post__identity">
                    <PostAvatar
                        avatar={post.author.avatar || '/logo.png'}
                        name={post.author.displayName}
                    />
                    <div className="feed-post__identity-copy">
                        <p className="feed-post__author">{post.author.displayName}</p>
                        <p className="feed-post__time">
                            {formatRelativeTime(post.createdAt, { prefix: 'Posted' })}
                        </p>
                    </div>
                </div>

                <button
                    className={
                        isFollowing
                            ? 'feed-post__follow feed-post__follow--active'
                            : 'feed-post__follow'
                    }
                    onClick={() => void handleFollow()}
                    type="button"
                    disabled={isFollowPending || isFollowing}
                >
                    {followLabel}
                </button>
            </div>

            <p className="feed-post__content">{getPostContentLabel(post)}</p>

            <div className="feed-post__actions">
                <button
                    className={
                        [
                            'feed-post__action',
                            post.likedByMe ? 'feed-post__action--active' : '',
                            isLikeAnimating ? 'feed-post__action--pulse' : '',
                        ]
                            .filter(Boolean)
                            .join(' ')
                    }
                    onClick={() => void handleLike()}
                    type="button"
                    aria-pressed={post.likedByMe}
                >
                    Like <span>{post.counts.likes}</span>
                </button>
                <button
                    className={
                        isCommentsOpen
                            ? 'feed-post__action feed-post__action--active'
                            : 'feed-post__action'
                    }
                    onClick={() => setIsCommentsOpen((current) => !current)}
                    type="button"
                >
                    Comment <span>{post.counts.comments}</span>
                </button>
            </div>

            {shouldShowComments ? (
                <section className="feed-post__comments" aria-label="Comments">
                    {showLoadAllComments ? (
                        <button
                            className="feed-post__comment-toggle"
                            onClick={() => setIsExpanded(true)}
                            type="button"
                        >
                            Show all {comments.length} comments
                        </button>
                    ) : null}

                    {showLoadMoreComments ? (
                        <button
                            className="feed-post__comment-toggle"
                            onClick={() => void handleToggleCommentView()}
                            type="button"
                        >
                            Show 10 more comments
                        </button>
                    ) : null}

                    {isLoadingComments ? (
                        <p className="feed-post__comment-state">Loading comments.</p>
                    ) : null}

                    <div className="feed-post__comment-list">
                        {visibleComments.map((comment) => (
                            <article
                                className={
                                    comment.isFresh
                                        ? 'feed-comment feed-comment--fresh'
                                        : 'feed-comment'
                                }
                                key={comment.id}
                            >
                                <div className="feed-comment__avatar" aria-hidden="true">
                                    {comment.avatar ? (
                                        <img src={comment.avatar} alt="" aria-hidden="true" />
                                    ) : (
                                        comment.authorName
                                            .split(/\s+/)
                                            .map((part) => part[0])
                                            .join('')
                                            .slice(0, 2)
                                            .toUpperCase()
                                    )}
                                </div>
                                <div className="feed-comment__body">
                                    <p>{comment.content}</p>
                                    <span>{formatRelativeTime(comment.createdAt)}</span>
                                </div>
                            </article>
                        ))}
                    </div>

                    <label className="feed-post__comment-composer">
                        <span className="sr-only">Write a comment</span>
                        <input
                            className="feed-post__comment-input"
                            onChange={(event) => setCommentDraft(event.target.value)}
                            onKeyDown={handleCommentKeyDown}
                            placeholder="Write a comment and press Enter"
                            type="text"
                            value={commentDraft}
                        />
                    </label>
                </section>
            ) : null}
        </article>
    );
}

export function AuthenticatedFeedPage({ session, onLogout }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [activeSection, setActiveSection] = useState('home');
    const [draft, setDraft] = useState('');
    const [isComposerFocused, setIsComposerFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [feedError, setFeedError] = useState('');
    const [posts, setPosts] = useState([]);
    const composerInputRef = useRef(null);

    useEffect(() => {
        let isActive = true;

        async function bootFeed() {
            setIsLoading(true);
            setFeedError('');

            try {
                const response = await listFeed(session.accessToken, {
                    limit: 20,
                });

                if (!isActive) {
                    return;
                }

                setPosts(response.data.map(normalizeFeedPost));
            } catch (error) {
                if (!isActive) {
                    return;
                }

                setFeedError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load the feed.',
                );
                setPosts(initialFeedPosts.map(normalizeSampleFeedPost));
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        void bootFeed();

        return () => {
            isActive = false;
        };
    }, [session.accessToken]);

    const visiblePosts = posts;
    const isExploreView = activeSection === 'explore';
    const isCommunityView = activeSection === 'community';
    const isMerchView = activeSection === 'merch';

    const sessionDisplayName = session.user.displayName;
    const sessionInitials = sessionDisplayName
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const updatePost = (postId, updater) => {
        setPosts((currentPosts) =>
            currentPosts.map((post) => (post.id === postId ? updater(post) : post)),
        );
    };

    const handleComposerSubmit = async (event) => {
        event.preventDefault();

        const trimmedDraft = draft.trim();

        if (!trimmedDraft) {
            return;
        }

        const optimisticPost = normalizeFeedPost({
            id: `post-${Date.now()}`,
            content: trimmedDraft,
            author: {
                id: session.user.id,
                displayName: sessionDisplayName,
                avatar: session.user.avatar || '/logo.png',
            },
            createdAt: new Date().toISOString(),
            counts: { likes: 0, comments: 0 },
            likedByMe: false,
            isFresh: true,
        });

        setPosts((currentPosts) => [optimisticPost, ...currentPosts]);
        setDraft('');
        setIsComposerFocused(false);

        try {
            const createdPost = await createPost(session.accessToken, trimmedDraft);
            const normalizedCreatedPost = normalizeFeedPost({
                ...createdPost,
                content:
                    typeof createdPost?.content === 'string'
                        ? createdPost.content
                        : trimmedDraft,
                author: {
                    id: session.user.id,
                    displayName: sessionDisplayName,
                    avatar: session.user.avatar || '/logo.png',
                },
                isFresh: true,
            });

            setPosts((currentPosts) => [
                normalizedCreatedPost,
                ...currentPosts.filter((post) => post.id !== optimisticPost.id),
            ]);
        } catch (error) {
            setPosts((currentPosts) =>
                currentPosts.filter((post) => post.id !== optimisticPost.id),
            );
            setFeedError(
                error instanceof Error
                    ? error.message
                    : 'Unable to create this post.',
            );
        }
    };

    const handleHidePost = (postId) => {
        setPosts((currentPosts) =>
            currentPosts.filter((post) => post.id !== postId),
        );
    };

    const handleLikePost = async (postId) => {
        const targetPost = posts.find((post) => post.id === postId);

        if (!targetPost) {
            return;
        }

        const wasLiked = targetPost.likedByMe;
        const likeRecordId = targetPost.likeId;

        if (wasLiked && !likeRecordId) {
            setFeedError(
                'Unable to unlike this post because the like record is missing. Reload the feed and try again.',
            );
            return;
        }

        updatePost(postId, (post) => ({
            ...post,
            likedByMe: !post.likedByMe,
            counts: {
                ...post.counts,
                likes: wasLiked
                    ? Math.max(0, post.counts.likes - 1)
                    : post.counts.likes + 1,
            },
        }));

        try {
            if (wasLiked) {
                await unlikePost(session.accessToken, likeRecordId);
                updatePost(postId, (post) => ({
                    ...post,
                    likeId: '',
                }));
            } else {
                const likeRecord = await likePost(session.accessToken, postId);

                if (likeRecord && typeof likeRecord.id === 'string') {
                    updatePost(postId, (post) => ({
                        ...post,
                        likeId: likeRecord.id,
                    }));
                }
            }
        } catch (error) {
            updatePost(postId, (post) => ({
                ...post,
                likedByMe: wasLiked,
                counts: {
                    ...post.counts,
                    likes: wasLiked
                        ? post.counts.likes + 1
                        : Math.max(0, post.counts.likes - 1),
                },
            }));

            setFeedError(
                error instanceof Error
                    ? error.message
                    : 'Unable to like that post.',
            );
        }
    };

    const handleFollowUser = async (userId) => {
        await followUser(session.accessToken, userId);
    };

    const handleCommentCreated = (postId) => {
        updatePost(postId, (post) => ({
            ...post,
            counts: {
                ...post.counts,
                comments: post.counts.comments + 1,
            },
        }));
    };

    const handleOpenOrganizerEvents = () => {
        navigate('/organizer/events');
    };

    const handleResetFeed = () => {
        setFeedError('');
        setDraft('');
        setIsComposerFocused(false);
        setIsLoading(true);
        void (async () => {
            try {
                const response = await listFeed(session.accessToken, {
                    limit: 20,
                });
                setPosts(response.data.map(normalizeFeedPost));
            } catch (error) {
                setFeedError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load the feed.',
                );
            } finally {
                setIsLoading(false);
            }
        })();
    };

    return (
        <main className="feed-shell">
            <a className="skip-link" href="#feed-main">
                Skip to feed
            </a>

            <div className="feed-grid">
                <aside className="feed-sidebar" aria-label="RunHop navigation">
                    <div className="feed-brand">
                        <img
                            className="feed-brand__logo"
                            src="/logo.png"
                            alt=""
                            aria-hidden="true"
                        />
                        <div className="feed-brand__copy">
                            <strong>RunHop</strong>
                            <span>Race platform</span>
                        </div>
                    </div>

                    <nav className="feed-sidebar__nav">
                        {feedNavigation.map((item) => (
                            <button
                                aria-current={
                                    activeSection === item.key
                                        ? 'page'
                                        : undefined
                                }
                                className={
                                    activeSection === item.key
                                        ? 'feed-nav-item feed-nav-item--active'
                                        : 'feed-nav-item'
                                }
                                key={item.label}
                                onClick={() => setActiveSection(item.key)}
                                type="button"
                            >
                                <span>{item.label}</span>
                                <small>{item.meta}</small>
                            </button>
                        ))}
                    </nav>

                    <button
                        className="button button--primary feed-sidebar__cta"
                        onClick={handleOpenOrganizerEvents}
                        type="button"
                    >
                        Create Race
                    </button>

                    <section
                        className="feed-sidebar__identity"
                        aria-label="Signed in user"
                    >
                        <div className="feed-avatar">{sessionInitials}</div>

                        <button
                            className="feed-sidebar__logout"
                            onClick={onLogout}
                            type="button"
                        >
                            Logout
                        </button>
                    </section>
                </aside>

                <section
                    className={
                        isExploreView || isCommunityView || isMerchView
                            ? 'feed-main feed-main--explore'
                            : 'feed-main'
                    }
                    id="feed-main"
                >
                    {isExploreView ? (
                        <ExploreCenter />
                    ) : isMerchView ? (
                        <MerchCenter />
                    ) : isCommunityView ? (
                        <CommunityCenter />
                    ) : (
                        <>
                            <header className="feed-main__header">
                                <div
                                    className="feed-tabs"
                                    role="tablist"
                                    aria-label="Feed sections"
                                >
                                    {feedTabs.map((tab) => (
                                        <button
                                            aria-selected={
                                                activeTab === tab.key
                                            }
                                            className={
                                                activeTab === tab.key
                                                    ? 'feed-tab feed-tab--active'
                                                    : 'feed-tab'
                                            }
                                            key={tab.key}
                                            onClick={() =>
                                                setActiveTab(tab.key)
                                            }
                                            role="tab"
                                            type="button"
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </header>

                            <form
                                className="composer"
                                onSubmit={handleComposerSubmit}
                            >
                                <div
                                    className="composer__avatar"
                                    aria-hidden="true"
                                >
                                    {sessionInitials}
                                </div>
                                <div className="composer__body">
                                    <label className="composer__field">
                                        <span className="sr-only">
                                            Write a post
                                        </span>
                                        <textarea
                                            ref={composerInputRef}
                                            name="post"
                                            onBlur={() =>
                                                setIsComposerFocused(false)
                                            }
                                            onChange={(event) =>
                                                setDraft(event.target.value)
                                            }
                                            onFocus={() =>
                                                setIsComposerFocused(true)
                                            }
                                            placeholder={
                                                activeTab === 'races'
                                                    ? 'Share a race or organizer update'
                                                    : 'Share a race note, training update, or organizer signal'
                                            }
                                            rows={
                                                isComposerFocused || draft
                                                    ? 4
                                                    : 2
                                            }
                                            value={draft}
                                        />
                                    </label>
                                    <div className="composer__footer">
                                        <p>
                                            {activeTab === 'races'
                                                ? 'Posting to Races & Orgs'
                                                : 'Posting to For You'}
                                        </p>
                                        <button
                                            className="button button--primary"
                                            disabled={!draft.trim()}
                                            type="submit"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {feedError ? (
                                <p className="feed-error" role="alert">
                                    {feedError}
                                </p>
                            ) : null}

                            <section aria-live="polite" className="feed-stream">
                                {isLoading ? (
                                    <FeedLoadingState />
                                ) : visiblePosts.length > 0 ? (
                                    visiblePosts.map((post) => (
                                        <FeedPostCard
                                            currentUser={session}
                                            key={post.id}
                                            onCommentCreated={handleCommentCreated}
                                            onFollowUser={handleFollowUser}
                                            onLikePost={handleLikePost}
                                            post={post}
                                        />
                                    ))
                                ) : (
                                    <FeedEmptyState
                                        activeTab={activeTab}
                                        onResetFeed={handleResetFeed}
                                        onStartRaceDraft={
                                            handleOpenOrganizerEvents
                                        }
                                        sessionDisplayName={sessionDisplayName}
                                    />
                                )}
                            </section>
                        </>
                    )}
                </section>

                <aside
                    className="feed-rail"
                    aria-label="Race utilities and trends"
                >
                    <section className="feed-rail__panel">
                        <div className="feed-rail__header">
                            <p className="feed-label">Trending races</p>
                        </div>
                        <div className="trending-list">
                            {trendingRaces.map((race) => (
                                <article
                                    className="trending-item"
                                    key={race.name}
                                >
                                    <p>{race.name}</p>
                                    <span>{race.date}</span>
                                    <small>{race.detail}</small>
                                </article>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    );
}
