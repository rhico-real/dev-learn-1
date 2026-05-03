import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  clearSession,
  loadSession,
  login,
  register,
  restoreSession,
  saveSession,
} from './auth';
import './styles.css';

const imageSources = {
  hero:
    'https://images.unsplash.com/photo-1762709753339-7bd2fea1f346?auto=format&fit=crop&w=1600&q=80',
  raceA:
    'https://images.unsplash.com/photo-1745790289741-12a211a8325d?auto=format&fit=crop&w=1200&q=80',
  raceB:
    'https://images.unsplash.com/photo-1758429700970-fd082d9e5d1d?auto=format&fit=crop&w=1200&q=80',
  groupA:
    'https://images.unsplash.com/photo-1769867627496-1a6b980d95cb?auto=format&fit=crop&w=1200&q=80',
  groupB:
    'https://images.unsplash.com/photo-1769867628125-f79281f22023?auto=format&fit=crop&w=1200&q=80',
};

const featuredRaces = [
  {
    title: 'Manila River Circuit',
    date: 'May 21, 2026',
    format: '21K, 10K, 5K',
    copy:
      'A disciplined city course built for serious pacing, sharp logistics, and a finish-line experience that looks worthy of the effort.',
    image: imageSources.raceA,
  },
  {
    title: 'Dawn Track Assembly',
    date: 'June 08, 2026',
    format: '10K, Relay, Junior Heat',
    copy:
      'Built for clubs, crews, and runners who care about structure. Fast access, clear splits, and clean race-day communication.',
    image: imageSources.raceB,
  },
  {
    title: 'Coastal Endurance Weekend',
    date: 'July 13, 2026',
    format: '42K, 21K, Community Run',
    copy:
      'A premium long-distance weekend for racers, supporters, and organizers who want one platform to carry registration, merch, and updates.',
    image: imageSources.hero,
  },
];

const communities = [
  {
    name: 'Pace Discipline Crew',
    location: 'BGC, Manila',
    detail: 'Intervals before sunrise, race-pace sessions on Sundays, and serious accountability week after week.',
  },
  {
    name: 'Saturday Long Group',
    location: 'Makati Loop',
    detail: 'A reliable long-run circle for runners training toward half and full marathon blocks.',
  },
  {
    name: 'City Riders Club',
    location: 'Pasig to Antipolo',
    detail: 'Structured cycling meetups for racers who want clean route planning and stronger local community ties.',
  },
];

const updates = [
  {
    title: 'Updated route map released for Manila River Circuit',
    category: 'Race Update',
    copy:
      'Hydration points, marshaling changes, and a clearer turnaround diagram are now live for registered runners.',
  },
  {
    title: 'Organizer merch drops now attach directly to registration pages',
    category: 'Platform',
    copy:
      'Race organizers can present apparel and add-on sales in the same trusted surface used for event signups.',
  },
  {
    title: 'Community captain tools are next on the roadmap',
    category: 'Social',
    copy:
      'The first marketing release already makes the direction clear: groups, races, and updates belong in one disciplined system.',
  },
];

const feedNavigation = [
  { label: 'Home', meta: 'Primary feed', active: true },
  { label: 'Explore', meta: 'Search races', active: false },
  { label: 'Community', meta: 'People and clubs', active: false },
  { label: 'Saved', meta: 'Race watchlist', active: false },
  { label: 'Messages', meta: 'Direct updates', active: false },
];

const utilityLinks = [
  { label: 'Create race', detail: 'Open a new event draft' },
  { label: 'Payments', detail: 'Review payouts and orders' },
  { label: 'Settings', detail: 'Account and profile control' },
  { label: 'User', detail: 'Profile, saved races, teams' },
];

const trendingRaces = [
  {
    name: 'South Loop 21K',
    date: 'May 21',
    detail: '1.4K runners tracking this week',
  },
  {
    name: 'Pasig Night Relay',
    date: 'May 29',
    detail: 'Organizer slots closing in 2 days',
  },
  {
    name: 'Coastal Tempo Ride',
    date: 'June 03',
    detail: 'Fastest-growing cycling event in feed',
  },
];

const initialFeedPosts = [
  {
    id: 'post-1',
    audience: 'all',
    source: 'race',
    author: 'Manila River Circuit',
    role: 'Organizer',
    time: '12m',
    headline: 'Final timing mats are now confirmed across all 21K checkpoints.',
    body:
      'Bib pickup opens Thursday at 16:00. Registered runners can now review the revised turnaround map and marshal notes before race morning.',
    metrics: {
      replies: 18,
      boosts: 42,
      saves: 116,
    },
    tone: 'Operational update',
  },
  {
    id: 'post-2',
    audience: 'all',
    source: 'runner',
    author: 'Coach Elise Tan',
    role: 'Runner',
    time: '28m',
    headline: 'Long-run groups keep asking the same question: which June races still have clean registration flow?',
    body:
      'South Loop 21K, Dawn Track Assembly, and Antipolo Climb Series are still the clearest sign-up experiences on the platform. Payment confirmation is landing within minutes, not hours.',
    metrics: {
      replies: 11,
      boosts: 29,
      saves: 84,
    },
    tone: 'Training note',
  },
  {
    id: 'post-3',
    audience: 'races',
    source: 'organizer',
    author: 'Coastal Endurance Weekend',
    role: 'Organizer',
    time: '1h',
    headline: 'Merch bundles are now attached directly to race registration.',
    body:
      'Organizers can pair singlets, caps, and support crew passes inside one checkout flow. The goal is cleaner selling, not more friction.',
    metrics: {
      replies: 8,
      boosts: 23,
      saves: 55,
    },
    tone: 'Product release',
  },
  {
    id: 'post-4',
    audience: 'races',
    source: 'race',
    author: 'Antipolo Climb Series',
    role: 'Race',
    time: '2h',
    headline: 'Wave assignments are visible now for riders who completed payment verification.',
    body:
      'Check rider profile, confirm your category, and review the neutral rollout protocol before Saturday. Support vehicles have been updated in the race packet.',
    metrics: {
      replies: 14,
      boosts: 31,
      saves: 73,
    },
    tone: 'Race bulletin',
  },
];

const feedTabs = [
  { key: 'all', label: 'For You' },
  { key: 'races', label: 'Races & Orgs' },
];

function App() {
  const [session, setSession] = useState(() => loadSession());
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function bootSession() {
      try {
        const nextSession = await restoreSession();

        if (isActive) {
          setSession(nextSession);
        }
      } catch {
        if (isActive) {
          clearSession();
          setSession(null);
        }
      } finally {
        if (isActive) {
          setIsSessionReady(true);
        }
      }
    }

    bootSession();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSessionChange = async (nextSession) => {
    const storedSession = saveSession(nextSession);

    if (!storedSession) {
      clearSession();
      setSession(null);
      setIsSessionReady(true);
      return;
    }

    setIsSessionReady(false);

    try {
      const restoredSession = await restoreSession(storedSession);
      setSession(restoredSession);
    } catch {
      clearSession();
      setSession(null);
    } finally {
      setIsSessionReady(true);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setIsSessionReady(true);
  };

  if (!isSessionReady) {
    return (
      <div className="app-boot">
        <div className="app-boot__panel">
          <p className="feed-label">RunHop</p>
          <h1>Checking your session.</h1>
          <p>Verifying account access through the current backend token.</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            session ? (
              <AuthenticatedFeedPage session={session} onLogout={handleLogout} />
            ) : (
              <MarketingPage session={session} />
            )
          }
        />
        <Route
          path="/login"
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage
                mode="login"
                eyebrow="Access your account"
                title="Login to RunHop"
                description="Review registrations, follow race updates, and step into the social side of serious running."
                buttonLabel="Sign in"
                fields={['email', 'password']}
                altLinkLabel="Need an account?"
                altLinkTo="/register"
                altLinkAction="Create one"
                onSessionChange={handleSessionChange}
              />
            )
          }
        />
        <Route
          path="/register"
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage
                mode="register"
                eyebrow="Create your account"
                title="Register for RunHop"
                description="Join the platform where race discovery, premium event presentation, and serious community start from one account."
                buttonLabel="Create account"
                fields={['displayName', 'email', 'password']}
                altLinkLabel="Already registered?"
                altLinkTo="/login"
                altLinkAction="Login"
                onSessionChange={handleSessionChange}
              />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function SiteFrame({ children, inverse = false, session = null }) {
  const location = useLocation();
  const inHome = location.pathname === '/';
  const inAuth = location.pathname === '/login' || location.pathname === '/register';
  const sectionHref = (hash) => (inHome ? hash : `/${hash}`);
  const logoSrc = '/logo.png';
  const sessionDisplayName =
    typeof session?.user?.displayName === 'string' ? session.user.displayName : '';
  const hasSession = Boolean(sessionDisplayName);
  const useHeroStyle = inHome || inAuth;
  const headerClassName = inHome
    ? 'topbar topbar--hero'
    : inAuth
      ? 'topbar topbar--shell topbar--auth topbar--auth-unified'
      : 'topbar topbar--shell';
  const brandClassName = useHeroStyle ? 'brand brand--hero' : 'brand brand--shell';
  const brandWordClassName = useHeroStyle
    ? 'brand__word brand__word--hero'
    : 'brand__word brand__word--shell';
  const navClassName = useHeroStyle
    ? 'topbar__nav topbar__nav--hero'
    : 'topbar__nav topbar__nav--shell';

  return (
    <div className={inverse ? 'site-shell site-shell--inverse' : 'site-shell'}>
      <header className={headerClassName}>
        <Link className={brandClassName} to="/" aria-label="RunHop homepage">
          <img className="brand__logo" src={logoSrc} alt="" aria-hidden="true" />
          <span className={brandWordClassName}>
            RunHop
            <small>Race platform</small>
          </span>
        </Link>
        <nav className={navClassName} aria-label="Primary">
          {useHeroStyle ? <a href={sectionHref('#top')}>Home</a> : null}
          <a href={sectionHref('#races')}>Races</a>
          <a href={sectionHref('#community')}>Community</a>
          <a href={sectionHref('#organizers')}>Organizers</a>
          <a href={sectionHref('#updates')}>Updates</a>

          {useHeroStyle && !hasSession ? (
            location.pathname !== '/login' ? <Link to="/login">Login</Link> : null
          ) : null}

          {useHeroStyle && hasSession ? (
            <span className="topbar__session">{sessionDisplayName}</span>
          ) : null}

          {useHeroStyle ? (
            hasSession ? (
              <span className="topbar__nav-accent topbar__nav-accent--muted">
                Signed in
              </span>
            ) : location.pathname !== '/register' ? (
              <Link className="topbar__nav-accent" to="/register">
                Join
              </Link>
            ) : null
          ) : null}
        </nav>
        {useHeroStyle ? null : (
          <div className="topbar__actions">
            {hasSession ? (
              <span className="topbar__session topbar__session--shell">
                {sessionDisplayName}
              </span>
            ) : (
              <>
                <Link className="text-action" to="/login">
                  Login
                </Link>
                <Link className="button button--topbar" to="/register">
                  Join RunHop
                </Link>
              </>
            )}
          </div>
        )}
      </header>
      {children}
    </div>
  );
}

function AuthenticatedFeedPage({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('all');
  const [draft, setDraft] = useState('');
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState(initialFeedPosts);
  const composerInputRef = useRef(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
    }, 720);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const visiblePosts = posts.filter((post) =>
    activeTab === 'all' ? true : post.audience === 'races',
  );

  const sessionDisplayName = session.user.displayName;
  const sessionInitials = sessionDisplayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleComposerSubmit = (event) => {
    event.preventDefault();

    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    setPosts((currentPosts) => [
      {
        id: `post-${Date.now()}`,
        audience: activeTab === 'races' ? 'races' : 'all',
        source: 'runner',
        author: sessionDisplayName,
        role: 'Member',
        time: 'Now',
        headline: trimmedDraft,
        body:
          activeTab === 'races'
            ? 'Shared to the races and organizers lane. Feed API wiring can replace this local interaction later.'
            : 'Shared to your main feed. This local composer is ready to connect to the posting API when it lands.',
        metrics: {
          replies: 0,
          boosts: 0,
          saves: 0,
        },
        tone: activeTab === 'races' ? 'Race note' : 'Community note',
      },
      ...currentPosts,
    ]);
    setDraft('');
    setIsComposerFocused(false);
  };

  const handleHidePost = (postId) => {
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
  };

  const handleStartRaceDraft = () => {
    setActiveTab('races');
    setDraft('Race announcement: ');
    setIsComposerFocused(true);
    window.requestAnimationFrame(() => {
      composerInputRef.current?.focus();
    });
  };

  const handleResetFeed = () => {
    setPosts(initialFeedPosts);
  };

  return (
    <main className="feed-shell">
      <a className="skip-link" href="#feed-main">
        Skip to feed
      </a>

      <div className="feed-grid">
        <aside className="feed-sidebar" aria-label="RunHop navigation">
          <div className="feed-brand">
            <img className="feed-brand__logo" src="/logo.png" alt="" aria-hidden="true" />
            <div className="feed-brand__copy">
              <strong>RunHop</strong>
              <span>Race platform</span>
            </div>
          </div>

          <nav className="feed-sidebar__nav">
            {feedNavigation.map((item) => (
              <div
                className={
                  item.active
                    ? 'feed-nav-item feed-nav-item--active'
                    : 'feed-nav-item'
                }
                key={item.label}
              >
                <span>{item.label}</span>
                <small>{item.meta}</small>
              </div>
            ))}
          </nav>

          <button
            className="button button--primary feed-sidebar__cta"
            onClick={handleStartRaceDraft}
            type="button"
          >
            Create race
          </button>

          <section className="feed-sidebar__identity" aria-label="Signed in user">
            <div className="feed-avatar">{sessionInitials}</div>
            <div>
              <p>{sessionDisplayName}</p>
              <span>Logged in athlete / organizer</span>
            </div>
            <button
              className="feed-sidebar__logout"
              onClick={onLogout}
              type="button"
            >
              Logout
            </button>
          </section>
        </aside>

        <section className="feed-main" id="feed-main">
          <header className="feed-main__header">
            <div className="feed-tabs" role="tablist" aria-label="Feed sections">
              {feedTabs.map((tab) => (
                <button
                  aria-selected={activeTab === tab.key}
                  className={
                    activeTab === tab.key ? 'feed-tab feed-tab--active' : 'feed-tab'
                  }
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>

          <form className="composer" onSubmit={handleComposerSubmit}>
            <div className="composer__avatar" aria-hidden="true">
              {sessionInitials}
            </div>
            <div className="composer__body">
              <label className="composer__field">
                <span className="sr-only">Write a post</span>
                <textarea
                  ref={composerInputRef}
                  name="post"
                  onBlur={() => setIsComposerFocused(false)}
                  onChange={(event) => setDraft(event.target.value)}
                  onFocus={() => setIsComposerFocused(true)}
                  placeholder={
                    activeTab === 'races'
                      ? 'Share a race or organizer update'
                      : 'Share a race note, training update, or organizer signal'
                  }
                  rows={isComposerFocused || draft ? 4 : 2}
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

          <section aria-live="polite" className="feed-stream">
            {isLoading ? (
              <FeedLoadingState />
            ) : visiblePosts.length > 0 ? (
              visiblePosts.map((post) => (
                <article className="feed-post" key={post.id}>
                  <div className="feed-post__meta">
                    <div>
                      <p className="feed-post__author">
                        {post.author}
                        <span>{post.role}</span>
                      </p>
                      <p className="feed-post__time">
                        {post.tone} · {post.time}
                      </p>
                    </div>
                    <button
                      className="feed-post__hide"
                      onClick={() => handleHidePost(post.id)}
                      type="button"
                    >
                      Hide
                    </button>
                  </div>
                  <h2>{post.headline}</h2>
                  <p>{post.body}</p>
                  <div className="feed-post__metrics" aria-label="Post activity">
                    <span>{post.metrics.replies} replies</span>
                    <span>{post.metrics.boosts} boosts</span>
                    <span>{post.metrics.saves} saves</span>
                  </div>
                </article>
              ))
            ) : (
              <FeedEmptyState
                activeTab={activeTab}
                onResetFeed={handleResetFeed}
                onStartRaceDraft={handleStartRaceDraft}
                sessionDisplayName={sessionDisplayName}
              />
            )}
          </section>
        </section>

        <aside className="feed-rail" aria-label="Race utilities and trends">
          <section className="feed-rail__panel">
            <div className="feed-rail__header">
              <p className="feed-label">Utility rail</p>
              <h2>Operate from the right.</h2>
            </div>
            <div className="feed-utility-list">
              {utilityLinks.map((item) => (
                <article className="feed-utility-item" key={item.label}>
                  <span>{item.label}</span>
                  <small>{item.detail}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="feed-rail__panel">
            <div className="feed-rail__header">
              <p className="feed-label">Trending races</p>
              <h2>Join what is gaining traction.</h2>
            </div>
            <div className="trending-list">
              {trendingRaces.map((race) => (
                <article className="trending-item" key={race.name}>
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

function FeedLoadingState() {
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

function FeedEmptyState({
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
        {sessionDisplayName}, this state is ready for the future `/feed` response. For now,
        you can repopulate the mocked stream or post the first update from the composer.
      </p>
      <div className="feed-empty__actions">
        <button className="button button--primary" onClick={onResetFeed} type="button">
          Restore sample feed
        </button>
        <button className="button button--ghost" onClick={onStartRaceDraft} type="button">
          Create race
        </button>
      </div>
    </article>
  );
}

function MarketingPage({ session = null }) {
  return (
    <SiteFrame session={session}>
      <main>
        <section className="hero" id="top">
          <img
            className="hero__backdrop"
            src={imageSources.hero}
            alt=""
            aria-hidden="true"
          />

          <div className="hero__content">
            <div className="hero__copy">
              <p className="eyebrow">For runners, cyclists, and race organizers</p>
              <div className="hero__headline">
                <span className="hero__headline-kicker">Race registration</span>
                <h1>
                  <span className="hero__headline-accent">Built for</span>
                  <span>the serious side</span>
                  <span>of movement.</span>
                </h1>
              </div>
            </div>

            <div className="hero__rail">
              <div className="hero__thumbs" aria-label="RunHop race moments">
                <figure className="hero-thumb">
                  <img
                    src={imageSources.raceA}
                    alt="Runners mid-stride on an urban road course"
                  />
                </figure>
                <figure className="hero-thumb">
                  <img
                    src={imageSources.raceB}
                    alt="A race pack accelerating through a wet road section"
                  />
                </figure>
              </div>

              <aside className="hero__panel">
                <p className="hero__lede">
                  RunHop gives organizers a credible place to present races, sell
                  registrations, and release updates while giving committed athletes
                  one disciplined platform to discover events and move with a real
                  community.
                </p>
                <div className="hero__actions">
                  <a className="button button--primary" href="#races">
                    Explore races
                  </a>
                  <a className="button button--ghost" href="#organizers">
                    For organizers
                  </a>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="ticker" aria-label="Race formats">
          <div className="ticker__track">
            <span>Marathons</span>
            <span>Half marathons</span>
            <span>10K race weekends</span>
            <span>Community runs</span>
            <span>Cycling events</span>
            <span>Organizer merch drops</span>
          </div>
        </section>

        <section className="section section--light" id="races">
          <div className="section__intro">
            <p className="eyebrow eyebrow--dark">Featured races</p>
            <h2>Upcoming events that look as serious as the people signing up.</h2>
            <p>
              The first marketing surface should prove one thing fast: RunHop is where
              races can be presented with authority, clarity, and enough editorial
              weight to earn trust.
            </p>
          </div>

          <div className="race-grid">
            {featuredRaces.map((race) => (
              <article className="race-card" key={race.title}>
                <img src={race.image} alt={race.title} />
                <div className="race-card__body">
                  <p className="race-card__meta">
                    <span>{race.date}</span>
                    <span>{race.format}</span>
                  </p>
                  <h3>{race.title}</h3>
                  <p>{race.copy}</p>
                  <Link to="/register">Register interest</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--dark" id="community">
          <div className="community-grid">
            <div className="community-grid__copy">
              <p className="eyebrow">Social running groups</p>
              <h2>A stronger community without the tone of a playful fitness app.</h2>
              <p>
                Social features still need discipline. The right tone is not casual
                noise, it is structure, rhythm, and people finding the right crew to
                run with.
              </p>
            </div>
            <div className="community-grid__visual">
              <img src={imageSources.groupA} alt="A running community on a boardwalk" />
              <img
                src={imageSources.groupB}
                alt="Runners grouped together after a training session"
              />
            </div>
          </div>

          <div className="community-list">
            {communities.map((community) => (
              <article className="community-list__item" key={community.name}>
                <div>
                  <p className="community-list__place">{community.location}</p>
                  <h3>{community.name}</h3>
                </div>
                <p>{community.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--organizers" id="organizers">
          <div className="organizer-panel">
            <div className="organizer-panel__copy">
              <p className="eyebrow eyebrow--dark">For race organizers</p>
              <h2>Present your races with authority, not marketplace clutter.</h2>
              <p>
                RunHop is built for organizers who want an event page that feels
                premium enough to sell on, clear enough to trust, and structured
                enough to keep athletes informed from announcement to race day.
              </p>
              <ul className="organizer-points">
                <li>Premium race pages for registrations and announcements</li>
                <li>Merch, add-ons, and supporting updates in one flow</li>
                <li>Clear information architecture for serious event buyers</li>
              </ul>
            </div>
            <div className="organizer-panel__stats">
              <article>
                <span>01</span>
                <h3>Event-led selling</h3>
                <p>
                  Registration, merch, and logistics stay under the same credible
                  surface.
                </p>
              </article>
              <article>
                <span>02</span>
                <h3>Trust by design</h3>
                <p>
                  Strong hierarchy, clean copy, and disciplined emphasis where buyers
                  need it most.
                </p>
              </article>
              <article>
                <span>03</span>
                <h3>Community carryover</h3>
                <p>
                  Events do not disappear after checkout, they keep a social and
                  update layer attached.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section--updates" id="updates">
          <div className="section__intro section__intro--compact">
            <p className="eyebrow eyebrow--dark">Latest news and merch</p>
            <h2>Updates that keep the platform active between race weekends.</h2>
          </div>

          <div className="updates-grid">
            {updates.map((update) => (
              <article className="update-card" key={update.title}>
                <p className="update-card__category">{update.category}</p>
                <h3>{update.title}</h3>
                <p>{update.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </SiteFrame>
  );
}

function AuthPage({
  mode,
  eyebrow,
  title,
  description,
  buttonLabel,
  fields,
  altLinkLabel,
  altLinkTo,
  altLinkAction,
  onSessionChange,
}) {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    displayName: '',
    email: '',
    password: '',
  });
  const [status, setStatus] = useState({
    submitting: false,
    error: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatus({
      submitting: true,
      error: '',
    });

    try {
      const payload =
        mode === 'register'
          ? {
              displayName: formState.displayName.trim(),
              email: formState.email.trim(),
              password: formState.password,
            }
          : {
              email: formState.email.trim(),
              password: formState.password,
            };

      const session = mode === 'register' ? await register(payload) : await login(payload);

      await onSessionChange(session);
      navigate('/', { replace: true });
    } catch (error) {
      setStatus({
        submitting: false,
        error: error instanceof Error ? error.message : 'Unable to continue.',
      });
      return;
    }
  };

  return (
    <SiteFrame inverse>
      <main className="auth-layout">
        <section className="auth-panel">
          <div className="auth-panel__content">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="auth-panel__quote">
            <span>RunHop standard</span>
            <p>Serious race participation deserves a serious product surface.</p>
          </div>
        </section>

        <section className="auth-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form__intro">
              <p className="auth-form__eyebrow">
                {mode === 'register' ? 'New account' : 'Member access'}
              </p>
              <h2>{buttonLabel}</h2>
            </div>

            {fields.includes('displayName') ? (
              <label>
                <span>Full name</span>
                <input
                  autoComplete="name"
                  name="displayName"
                  onChange={handleChange}
                  placeholder="Your name"
                  type="text"
                  value={formState.displayName}
                />
              </label>
            ) : null}

            <label>
              <span>Email address</span>
              <input
                autoComplete="email"
                name="email"
                onChange={handleChange}
                placeholder="name@example.com"
                type="email"
                value={formState.email}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                autoComplete={
                  mode === 'register' ? 'new-password' : 'current-password'
                }
                name="password"
                onChange={handleChange}
                placeholder="Enter password"
                type="password"
                value={formState.password}
              />
            </label>

            {status.error ? (
              <p className="auth-form__error" role="alert">
                {status.error}
              </p>
            ) : null}

            <button className="button button--primary auth-form__submit" type="submit">
              {status.submitting ? 'Working...' : buttonLabel}
            </button>

            <p className="auth-form__hint">
              {altLinkLabel} <Link to={altLinkTo}>{altLinkAction}</Link>
            </p>
          </form>
        </section>
      </main>
    </SiteFrame>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
