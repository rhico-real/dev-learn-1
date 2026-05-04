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
    hero: 'https://images.unsplash.com/photo-1762709753339-7bd2fea1f346?auto=format&fit=crop&w=1600&q=80',
    raceA: 'https://images.unsplash.com/photo-1745790289741-12a211a8325d?auto=format&fit=crop&w=1200&q=80',
    raceB: 'https://images.unsplash.com/photo-1758429700970-fd082d9e5d1d?auto=format&fit=crop&w=1200&q=80',
    groupA: 'https://images.unsplash.com/photo-1769867627496-1a6b980d95cb?auto=format&fit=crop&w=1200&q=80',
    groupB: 'https://images.unsplash.com/photo-1769867628125-f79281f22023?auto=format&fit=crop&w=1200&q=80',
};

const featuredRaces = [
    {
        title: 'Manila River Circuit',
        date: 'May 21, 2026',
        format: '21K, 10K, 5K',
        copy: 'A disciplined city course built for serious pacing, sharp logistics, and a finish-line experience that looks worthy of the effort.',
        image: imageSources.raceA,
    },
    {
        title: 'Dawn Track Assembly',
        date: 'June 08, 2026',
        format: '10K, Relay, Junior Heat',
        copy: 'Built for clubs, crews, and runners who care about structure. Fast access, clear splits, and clean race-day communication.',
        image: imageSources.raceB,
    },
    {
        title: 'Coastal Endurance Weekend',
        date: 'July 13, 2026',
        format: '42K, 21K, Community Run',
        copy: 'A premium long-distance weekend for racers, supporters, and organizers who want one platform to carry registration, merch, and updates.',
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
        copy: 'Hydration points, marshaling changes, and a clearer turnaround diagram are now live for registered runners.',
    },
    {
        title: 'Organizer merch drops now attach directly to registration pages',
        category: 'Platform',
        copy: 'Race organizers can present apparel and add-on sales in the same trusted surface used for event signups.',
    },
    {
        title: 'Community captain tools are next on the roadmap',
        category: 'Social',
        copy: 'The first marketing release already makes the direction clear: groups, races, and updates belong in one disciplined system.',
    },
];

const feedNavigation = [
    { key: 'home', label: 'Home', meta: 'Primary feed' },
    { key: 'community', label: 'Community', meta: 'People and clubs' },
    { key: 'explore', label: 'Explore', meta: 'Explore races' },
    { key: 'merch', label: 'Merch', meta: 'Buy merch' },
    { key: 'saved', label: 'Saved', meta: 'Race watchlist' },
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
        headline:
            'Final timing mats are now confirmed across all 21K checkpoints.',
        body: 'Bib pickup opens Thursday at 16:00. Registered runners can now review the revised turnaround map and marshal notes before race morning.',
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
        headline:
            'Long-run groups keep asking the same question: which June races still have clean registration flow?',
        body: 'South Loop 21K, Dawn Track Assembly, and Antipolo Climb Series are still the clearest sign-up experiences on the platform. Payment confirmation is landing within minutes, not hours.',
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
        headline:
            'Merch bundles are now attached directly to race registration.',
        body: 'Organizers can pair singlets, caps, and support crew passes inside one checkout flow. The goal is cleaner selling, not more friction.',
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
        headline:
            'Wave assignments are visible now for riders who completed payment verification.',
        body: 'Check rider profile, confirm your category, and review the neutral rollout protocol before Saturday. Support vehicles have been updated in the race packet.',
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

const exploreHeroSlides = [
    {
        eyebrow: 'Trackside release',
        title: '15% off with code Spring15',
        detail: 'A restrained merch window for race-day layers, premium travel pieces, and event-led drops that belong beside serious race listings.',
        image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80',
        cta: 'Shop now',
    },
];

const bestSellerItems = [
    {
        name: 'RunHop duffle bag',
        price: '₱8,400',
        meta: 'Travel gear',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Abstract circuit sweatshirt',
        price: '₱6,800',
        meta: 'Layering',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Carbon pace headset',
        price: '₱4,900',
        meta: 'Training audio',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Support crew bottle',
        price: '₱2,200',
        meta: 'Hydration',
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80',
    },
];

const hotRaceItems = [
    {
        name: 'South Loop 21K',
        city: 'Makati',
        date: 'May 21',
        detail: 'Night-lit city course, disciplined corral release, merch pickup inside the same venue.',
        image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
    },
    {
        name: 'Harbor Dawn 10K',
        city: 'Pasay',
        date: 'June 03',
        detail: 'Fast waterfront pacing with controlled wave starts and high-trust organizer comms.',
        image: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1200&q=80',
    },
    {
        name: 'Coastal Tempo Ride',
        city: 'Batangas',
        date: 'June 16',
        detail: 'A premium cycling weekend with route notes, add-ons, and post-race dispatches in one surface.',
        image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    },
];

const upcomingEventItems = [
    {
        title: 'Organizer showroom',
        date: 'May 18',
        time: '18:30',
        detail: 'A static editorial slot for featured race sellers, merchandise bundles, and registration pushes.',
    },
    {
        title: 'Bib pickup weekend',
        date: 'May 20',
        time: '10:00',
        detail: 'Prominent wayfinding for pickup, merch redemption, and support crew handover.',
    },
    {
        title: 'Community pace briefing',
        date: 'May 24',
        time: '06:00',
        detail: 'A content lane for captains, pacers, and final operational reminders before race day.',
    },
];

const exploreCategories = [
    {
        name: 'Race weekend',
        image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Performance layers',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Collector models',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Support essentials',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    },
];

const featuredRaceSlides = [
    {
        eyebrow: 'Featured race weekend',
        title: 'Turning race pace into a clean finish',
        detail: 'Step into race weekends with stronger presentation, sharper logistics, and a more premium surface for athletes deciding where to commit next.',
        image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=1600&q=80',
        primaryCta: 'Register now',
        secondaryCta: 'Race details',
        raceInset: {
            title: 'Night relay heat',
            label: 'Another featured race',
            image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80',
        },
        merchInset: {
            title: 'Finisher medal',
            label: 'Merch and medals',
            image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80',
        },
    },
    {
        eyebrow: 'Organizer spotlight',
        title: 'Run harder, arrive to a better race surface',
        detail: 'Featured races should look operationally credible before an athlete ever reaches checkout, with merch and medals still visible inside the same world.',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80',
        primaryCta: 'See featured race',
        secondaryCta: 'View schedule',
        raceInset: {
            title: 'Coastal 21K',
            label: 'Another featured race',
            image: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=900&q=80',
        },
        merchInset: {
            title: 'Race-day cap',
            label: 'Merch and medals',
            image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80',
        },
    },
    {
        eyebrow: 'Club priority window',
        title: 'Find the next serious race before it fills',
        detail: 'A stronger hero lane for marquee races, member access windows, and the kind of race-week merchandise that belongs next to the event itself.',
        image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1600&q=80',
        primaryCta: 'Explore races',
        secondaryCta: 'Organizer page',
        raceInset: {
            title: 'Harbor dawn 10K',
            label: 'Another featured race',
            image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=900&q=80',
        },
        merchInset: {
            title: 'Podium medal set',
            label: 'Merch and medals',
            image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
        },
    },
];

const nearbyRaceItems = [
    {
        title: 'Weekend circuit meetup',
        venue: 'BGC Track Loop',
        date: 'Sept 10, 2026',
        image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80',
    },
    {
        title: 'Beginner pacing session',
        venue: 'Makati Indoor Arena',
        date: 'Sept 15, 2026',
        image: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=900&q=80',
    },
    {
        title: 'Monthly friendly match',
        venue: 'Pasig Endurance Club',
        date: 'Sept 20, 2026',
        image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=900&q=80',
    },
    {
        title: 'Race fitness workshop',
        venue: 'Alabang Sports Hall',
        date: 'Sept 25, 2026',
        image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=900&q=80',
    },
];

const recommendedRaceItems = [
    {
        title: 'Doubles relay edition',
        venue: 'Circuit Grounds',
        date: 'Oct 6, 2026',
        image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80',
    },
    {
        title: 'Youth pace clinic',
        venue: 'Quezon City Arena',
        date: 'Oct 12, 2026',
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
    },
    {
        title: 'Intermediate skills block',
        venue: 'Ortigas Training Deck',
        date: 'Oct 18, 2026',
        image: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&w=900&q=80',
    },
    {
        title: 'Night social run',
        venue: 'Marikina River Park',
        date: 'Oct 25, 2026',
        image: 'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=900&q=80',
    },
];

const communityHero = {
    eyebrow: 'People and organizations',
    title: 'A serious network behind every race weekend',
    detail: 'Find organizing groups, captains, and committed athletes without turning the surface into a casual social feed.',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80',
};

const organizationItems = [
    {
        name: 'South Loop Run Club',
        type: 'Organizer',
        image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Coastal Endurance Co.',
        type: 'Event team',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Pasig Track Assembly',
        type: 'Race organizer',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Summit Riders Guild',
        type: 'Cycling club',
        image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=900&q=80',
    },
];

const peopleItems = [
    {
        name: 'Elise Tan',
        role: 'Coach and pacer',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Julian Cruz',
        role: 'Organizer lead',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Maya Reyes',
        role: 'Club captain',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Andre Lim',
        role: 'Race director',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    },
];

const createRaceToolbar = [
    { label: 'B', command: 'bold', title: 'Bold' },
    { label: 'I', command: 'italic', title: 'Italic' },
    { label: 'U', command: 'underline', title: 'Underline' },
    { label: 'H2', command: 'formatBlock', value: 'h2', title: 'Heading' },
    {
        label: '• List',
        command: 'insertUnorderedList',
        title: 'Bullet list',
    },
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
                    <p>
                        Verifying account access through the current backend
                        token.
                    </p>
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
                            <AuthenticatedFeedPage
                                session={session}
                                onLogout={handleLogout}
                            />
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
                <Route
                    path="/create-race"
                    element={
                        session ? (
                            <CreateRacePage session={session} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/create-race/merch-coming-soon"
                    element={
                        session ? (
                            <MerchComingSoonPage session={session} />
                        ) : (
                            <Navigate to="/login" replace />
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
    const inAuth =
        location.pathname === '/login' || location.pathname === '/register';
    const sectionHref = (hash) => (inHome ? hash : `/${hash}`);
    const logoSrc = '/logo.png';
    const sessionDisplayName =
        typeof session?.user?.displayName === 'string'
            ? session.user.displayName
            : '';
    const hasSession = Boolean(sessionDisplayName);
    const useHeroStyle = inHome || inAuth;
    const headerClassName = inHome
        ? 'topbar topbar--hero'
        : inAuth
          ? 'topbar topbar--shell topbar--auth topbar--auth-unified'
          : 'topbar topbar--shell';
    const brandClassName = useHeroStyle
        ? 'brand brand--hero'
        : 'brand brand--shell';
    const brandWordClassName = useHeroStyle
        ? 'brand__word brand__word--hero'
        : 'brand__word brand__word--shell';
    const navClassName = useHeroStyle
        ? 'topbar__nav topbar__nav--hero'
        : 'topbar__nav topbar__nav--shell';

    return (
        <div
            className={
                inverse ? 'site-shell site-shell--inverse' : 'site-shell'
            }
        >
            <header className={headerClassName}>
                <Link
                    className={brandClassName}
                    to="/"
                    aria-label="RunHop homepage"
                >
                    <img
                        className="brand__logo"
                        src={logoSrc}
                        alt=""
                        aria-hidden="true"
                    />
                    <span className={brandWordClassName}>
                        RunHop
                        <small>Race platform</small>
                    </span>
                </Link>
                <nav className={navClassName} aria-label="Primary">
                    {useHeroStyle ? (
                        <a href={sectionHref('#top')}>Home</a>
                    ) : null}
                    {/* <a href={sectionHref('#races')}>Races</a>
                    <a href={sectionHref('#community')}>Community</a>
                    <a href={sectionHref('#organizers')}>Organizers</a>
                    <a href={sectionHref('#updates')}>Updates</a> */}
                    <span className="topbar__session topbar__session--shell">
                        CREATE RACE
                    </span>
                    {useHeroStyle && !hasSession ? (
                        location.pathname !== '/login' ? (
                            <Link to="/login">Login</Link>
                        ) : null
                    ) : null}

                    {useHeroStyle && hasSession ? (
                        <span className="topbar__session">
                            {sessionDisplayName}
                        </span>
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
                                <Link
                                    className="button button--topbar"
                                    to="/register"
                                >
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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [activeSection, setActiveSection] = useState('home');
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
        setPosts((currentPosts) =>
            currentPosts.filter((post) => post.id !== postId),
        );
    };

    const handleStartRaceDraft = () => {
        navigate('/create-race');
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
                        onClick={handleStartRaceDraft}
                        type="button"
                    >
                        Create race
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

                            <section aria-live="polite" className="feed-stream">
                                {isLoading ? (
                                    <FeedLoadingState />
                                ) : visiblePosts.length > 0 ? (
                                    visiblePosts.map((post) => (
                                        <article
                                            className="feed-post"
                                            key={post.id}
                                        >
                                            <div className="feed-post__meta">
                                                <div>
                                                    <p className="feed-post__author">
                                                        {post.author}
                                                        <span>{post.role}</span>
                                                    </p>
                                                    <p className="feed-post__time">
                                                        {post.tone} ·{' '}
                                                        {post.time}
                                                    </p>
                                                </div>
                                                <button
                                                    className="feed-post__hide"
                                                    onClick={() =>
                                                        handleHidePost(post.id)
                                                    }
                                                    type="button"
                                                >
                                                    Hide
                                                </button>
                                            </div>
                                            <h2>{post.headline}</h2>
                                            <p>{post.body}</p>
                                            <div
                                                className="feed-post__metrics"
                                                aria-label="Post activity"
                                            >
                                                <span>
                                                    {post.metrics.replies}{' '}
                                                    replies
                                                </span>
                                                <span>
                                                    {post.metrics.boosts} boosts
                                                </span>
                                                <span>
                                                    {post.metrics.saves} saves
                                                </span>
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
                        </>
                    )}
                </section>

                <aside
                    className="feed-rail"
                    aria-label="Race utilities and trends"
                >
                    {/* <section className="feed-rail__panel">
                        <div className="feed-rail__header">
                            <p className="feed-label">Utility rail</p>
                            <h2>Operate from the right.</h2>
                        </div>
                        <div className="feed-utility-list">
                            {utilityLinks.map((item) => (
                                <article
                                    className="feed-utility-item"
                                    key={item.label}
                                >
                                    <span>{item.label}</span>
                                    <small>{item.detail}</small>
                                </article>
                            ))}
                        </div>
                    </section> */}

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

function CreateRacePage({ session }) {
    const navigate = useNavigate();
    const editorRef = useRef(null);
    const [raceTitle, setRaceTitle] = useState('');
    const [posterName, setPosterName] = useState('');
    const [posterPreviewUrl, setPosterPreviewUrl] = useState('');
    const [orgLogoName, setOrgLogoName] = useState('');
    const [orgLogoPreviewUrl, setOrgLogoPreviewUrl] = useState('');
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [headerMode, setHeaderMode] = useState('poster-title-logo');
    const [editorHtml, setEditorHtml] = useState(
        '<p>Start with the race promise, then explain route structure, timing windows, registration details, and what makes the event worth committing to.</p>',
    );

    const handlePosterChange = (event) => {
        const file = event.target.files?.[0];
        setPosterName(file ? file.name : '');
        setPosterPreviewUrl((currentUrl) => {
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
            return file ? URL.createObjectURL(file) : '';
        });
    };

    const handleOrgLogoChange = (event) => {
        const file = event.target.files?.[0];
        setOrgLogoName(file ? file.name : '');
        setOrgLogoPreviewUrl((currentUrl) => {
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
            return file ? URL.createObjectURL(file) : '';
        });
    };

    const handleGalleryChange = (event) => {
        const files = Array.from(event.target.files ?? []);
        setGalleryFiles(files.map((file) => file.name));
        setGalleryPreviews((currentUrls) => {
            currentUrls.forEach((url) => URL.revokeObjectURL(url));
            return files.map((file) => URL.createObjectURL(file));
        });
    };

    const handleToolbarAction = (command, value = null) => {
        editorRef.current?.focus();
        if (command === 'formatBlock' && value) {
            document.execCommand(command, false, value);
        } else {
            document.execCommand(command, false);
        }
        setEditorHtml(editorRef.current?.innerHTML ?? '');
    };

    const handleEditorInput = () => {
        setEditorHtml(editorRef.current?.innerHTML ?? '');
    };

    useEffect(() => {
        return () => {
            if (posterPreviewUrl) {
                URL.revokeObjectURL(posterPreviewUrl);
            }
            if (orgLogoPreviewUrl) {
                URL.revokeObjectURL(orgLogoPreviewUrl);
            }
            galleryPreviews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [galleryPreviews, orgLogoPreviewUrl, posterPreviewUrl]);

    const previewTitle = raceTitle.trim() || 'South Loop 21K Weekend';
    const previewLogoSrc = orgLogoPreviewUrl || '/logo.png';
    const previewBodyHasContent = editorHtml.trim().length > 0;

    return (
        <SiteFrame session={session}>
            <main className="create-race-page">
                <section className="create-race-layout">
                    <aside className="create-race-preview">
                        <section className="create-race-preview__frame">
                            <div className="create-race-preview__hero">
                                {posterPreviewUrl ? (
                                    <img
                                        alt={previewTitle}
                                        className="create-race-preview__poster"
                                        src={posterPreviewUrl}
                                    />
                                ) : (
                                    <div className="create-race-preview__poster-fallback" />
                                )}
                                <div className="create-race-preview__gradient" />

                                {headerMode !== 'poster-only' ? (
                                    <div className="create-race-preview__overlay">
                                        <p className="feed-label">
                                            Featured race
                                        </p>
                                        <h2>{previewTitle}</h2>
                                    </div>
                                ) : null}

                                {headerMode === 'poster-title-logo' ? (
                                    <div className="create-race-preview__logo">
                                        <img
                                            alt="Organization logo"
                                            src={previewLogoSrc}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            <div className="create-race-preview__body">
                                <div className="create-race-preview__content">
                                    <h3>{previewTitle}</h3>
                                    {previewBodyHasContent ? (
                                        <div
                                            className="create-race-preview__prose"
                                            dangerouslySetInnerHTML={{
                                                __html: editorHtml,
                                            }}
                                        />
                                    ) : (
                                        <p>
                                            Start writing race details to see
                                            the event page preview here.
                                        </p>
                                    )}
                                </div>

                                {galleryPreviews.length > 0 ? (
                                    <div className="create-race-preview__gallery">
                                        {galleryPreviews.map(
                                            (imageUrl, index) => (
                                                <img
                                                    alt={`Race gallery preview ${index + 1}`}
                                                    key={imageUrl}
                                                    src={imageUrl}
                                                />
                                            ),
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    </aside>

                    <div className="create-race-form">
                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Preview header</p>
                                <h2>Choose how the poster is presented.</h2>
                            </div>
                            <div
                                className="create-race-mode-switch"
                                role="radiogroup"
                                aria-label="Header modes"
                            >
                                {[
                                    {
                                        key: 'poster-only',
                                        label: 'Poster only',
                                    },
                                    {
                                        key: 'poster-title',
                                        label: 'Title overlay',
                                    },
                                    {
                                        key: 'poster-title-logo',
                                        label: 'Title and logo',
                                    },
                                ].map((mode) => (
                                    <button
                                        aria-pressed={headerMode === mode.key}
                                        className={
                                            headerMode === mode.key
                                                ? 'create-race-mode create-race-mode--active'
                                                : 'create-race-mode'
                                        }
                                        key={mode.key}
                                        onClick={() => setHeaderMode(mode.key)}
                                        type="button"
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Race poster</p>
                                <h2>
                                    Upload the banner athletes will see first.
                                </h2>
                            </div>
                            <label className="upload-dropzone">
                                <input
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handlePosterChange}
                                    type="file"
                                />
                                <span className="upload-dropzone__eyebrow">
                                    Poster image
                                </span>
                                <strong>
                                    {posterName || 'Choose a banner image'}
                                </strong>
                                <small>
                                    Use a wide race poster or hero visual with
                                    strong contrast.
                                </small>
                            </label>
                        </section>

                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Organization logo</p>
                                <h2>Use a logo in the third header mode.</h2>
                            </div>
                            <label className="upload-dropzone">
                                <input
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleOrgLogoChange}
                                    type="file"
                                />
                                <span className="upload-dropzone__eyebrow">
                                    Organization mark
                                </span>
                                <strong>
                                    {orgLogoName || 'Choose a logo image'}
                                </strong>
                                <small>
                                    If no logo is uploaded, the preview uses the
                                    RunHop mark for now.
                                </small>
                            </label>
                        </section>

                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Race title</p>
                                <h2>Name the event with authority.</h2>
                            </div>
                            <label className="create-race-field">
                                <span>Title</span>
                                <input
                                    onChange={(event) =>
                                        setRaceTitle(event.target.value)
                                    }
                                    placeholder="South Loop 21K Weekend"
                                    type="text"
                                    value={raceTitle}
                                />
                            </label>
                        </section>

                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Race story</p>
                                <h2>
                                    Write the event page with real hierarchy.
                                </h2>
                            </div>
                            <div className="editor-shell">
                                <div
                                    className="editor-toolbar"
                                    role="toolbar"
                                    aria-label="Race content formatting"
                                >
                                    {createRaceToolbar.map((item) => (
                                        <button
                                            className="editor-toolbar__button"
                                            key={`${item.command}-${item.label}`}
                                            onClick={() =>
                                                handleToolbarAction(
                                                    item.command,
                                                    item.value,
                                                )
                                            }
                                            title={item.title}
                                            type="button"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                                <div
                                    aria-label="Race content editor"
                                    className="editor-surface"
                                    contentEditable
                                    dangerouslySetInnerHTML={{
                                        __html: editorHtml,
                                    }}
                                    onInput={handleEditorInput}
                                    ref={editorRef}
                                    role="textbox"
                                    suppressContentEditableWarning
                                />
                            </div>
                        </section>

                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Gallery</p>
                                <h2>Add supporting race images.</h2>
                            </div>
                            <label className="upload-dropzone upload-dropzone--gallery">
                                <input
                                    accept="image/*"
                                    className="sr-only"
                                    multiple
                                    onChange={handleGalleryChange}
                                    type="file"
                                />
                                <span className="upload-dropzone__eyebrow">
                                    Supporting images
                                </span>
                                <strong>
                                    {galleryFiles.length > 0
                                        ? `${galleryFiles.length} file${galleryFiles.length > 1 ? 's' : ''} selected`
                                        : 'Select race gallery images'}
                                </strong>
                                <small>
                                    Add route visuals, crowd moments, or
                                    previous race-day atmosphere.
                                </small>
                            </label>
                            {galleryFiles.length > 0 ? (
                                <div className="upload-file-list">
                                    {galleryFiles.map((file) => (
                                        <span key={file}>{file}</span>
                                    ))}
                                </div>
                            ) : null}
                        </section>
                    </div>

                    <aside className="create-race-sidebar">
                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Merch handoff</p>
                                <h2>Merch setup lands on the next route.</h2>
                            </div>
                            <p className="create-race-sidebar__copy">
                                Keep the race authoring page focused. Merch can
                                branch into its own dedicated flow once it is
                                ready.
                            </p>
                            <button
                                className="button button--primary"
                                onClick={() =>
                                    navigate('/create-race/merch-coming-soon')
                                }
                                type="button"
                            >
                                Add merch
                            </button>
                        </section>

                        <section className="create-race-panel create-race-panel--summary">
                            <p className="feed-label">Preview rhythm</p>
                            <ul className="create-race-summary">
                                <li>
                                    Poster first, title second, editorial copy
                                    third.
                                </li>
                                <li>Gallery supports trust, not decoration.</li>
                                <li>
                                    Merch stays separate until the next flow is
                                    ready.
                                </li>
                            </ul>
                        </section>
                    </aside>
                </section>
            </main>
        </SiteFrame>
    );
}

function MerchComingSoonPage({ session }) {
    return (
        <SiteFrame session={session}>
            <main className="coming-soon-page">
                <section className="coming-soon-panel">
                    <p className="feed-label">Create race</p>
                    <h1>Merch setup is coming soon.</h1>
                    <p>
                        The race authoring flow is ready now. Merch will move
                        into its own next-step page once product and checkout
                        details are settled.
                    </p>
                    <Link className="button button--primary" to="/create-race">
                        Back to create race
                    </Link>
                </section>
            </main>
        </SiteFrame>
    );
}

function MerchCenter() {
    return (
        <div className="explore-center">
            <section className="explore-hero" aria-label="Featured merch drop">
                <div className="explore-hero__filmstrip" aria-hidden="true">
                    <div className="explore-hero__film explore-hero__film--left" />
                    <div className="explore-hero__film explore-hero__film--right" />
                </div>

                {exploreHeroSlides.map((slide) => (
                    <article className="explore-hero__card" key={slide.title}>
                        <img
                            alt="Feature merchandising backdrop"
                            className="explore-hero__image"
                            src={slide.image}
                        />
                        <div className="explore-hero__overlay" />
                        <div className="explore-hero__content">
                            <p className="feed-label">{slide.eyebrow}</p>
                            <h1>{slide.title}</h1>
                            <p>{slide.detail}</p>
                            <div className="explore-hero__actions">
                                <button
                                    className="button button--primary"
                                    type="button"
                                >
                                    {slide.cta}
                                </button>
                                <div
                                    className="explore-hero__pager"
                                    aria-label="Slide position"
                                >
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </div>
                        </div>
                        <div
                            className="explore-hero__controls"
                            aria-hidden="true"
                        >
                            <span>←</span>
                            <span>→</span>
                        </div>
                    </article>
                ))}
            </section>

            <section className="explore-section">
                <div className="explore-section__heading">
                    <p className="feed-label">Best sellers</p>
                    <h2>Merch that belongs beside the event itself.</h2>
                </div>
                <div className="explore-merch-grid">
                    {bestSellerItems.map((item) => (
                        <article className="explore-product" key={item.name}>
                            <div className="explore-product__image-wrap">
                                <img alt={item.name} src={item.image} />
                            </div>
                            <div className="explore-product__meta">
                                <span>{item.meta}</span>
                                <strong>{item.price}</strong>
                            </div>
                            <h3>{item.name}</h3>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}

function ExploreCenter() {
    const [activeSlide, setActiveSlide] = useState(0);
    const slide = featuredRaceSlides[activeSlide];

    const handlePreviousSlide = () => {
        setActiveSlide((current) =>
            current === 0 ? featuredRaceSlides.length - 1 : current - 1,
        );
    };

    const handleNextSlide = () => {
        setActiveSlide((current) =>
            current === featuredRaceSlides.length - 1 ? 0 : current + 1,
        );
    };

    return (
        <div className="race-explore-center">
            <section
                className="race-feature"
                aria-label="Featured races carousel"
            >
                <article className="race-feature__hero">
                    <img
                        alt={slide.title}
                        className="race-feature__image"
                        src={slide.image}
                    />
                    <div className="race-feature__overlay" />
                    <div className="race-feature__content">
                        <p className="feed-label">{slide.eyebrow}</p>
                        <h1>{slide.title}</h1>
                        <p>{slide.detail}</p>
                        <div className="race-feature__actions">
                            <button
                                className="button button--primary"
                                type="button"
                            >
                                {slide.primaryCta}
                            </button>
                            <button
                                className="button button--ghost"
                                type="button"
                            >
                                {slide.secondaryCta}
                            </button>
                        </div>
                    </div>
                    <div className="race-feature__rail">
                        <article className="race-feature__inset">
                            <img
                                alt={slide.raceInset.title}
                                src={slide.raceInset.image}
                            />
                            <div className="race-feature__inset-copy">
                                <span>{slide.raceInset.label}</span>
                                <strong>{slide.raceInset.title}</strong>
                            </div>
                        </article>
                        <article className="race-feature__inset">
                            <img
                                alt={slide.merchInset.title}
                                src={slide.merchInset.image}
                            />
                            <div className="race-feature__inset-copy">
                                <span>{slide.merchInset.label}</span>
                                <strong>{slide.merchInset.title}</strong>
                            </div>
                        </article>
                    </div>
                    <div className="race-feature__controls">
                        <button
                            aria-label="Previous featured race"
                            className="race-feature__control"
                            onClick={handlePreviousSlide}
                            type="button"
                        >
                            ←
                        </button>
                        <button
                            aria-label="Next featured race"
                            className="race-feature__control"
                            onClick={handleNextSlide}
                            type="button"
                        >
                            →
                        </button>
                    </div>
                    <div className="race-feature__pager" aria-label="Slides">
                        {featuredRaceSlides.map((item, index) => (
                            <button
                                aria-label={`Go to ${item.title}`}
                                aria-pressed={index === activeSlide}
                                className={
                                    index === activeSlide
                                        ? 'race-feature__dot race-feature__dot--active'
                                        : 'race-feature__dot'
                                }
                                key={item.title}
                                onClick={() => setActiveSlide(index)}
                                type="button"
                            />
                        ))}
                    </div>
                </article>
            </section>

            <section className="explore-section">
                <div className="explore-section__heading explore-section__heading--split">
                    <div>
                        <p className="feed-label">Nearby races</p>
                        <h2>
                            Closer events with stronger operational clarity.
                        </h2>
                    </div>
                    <p className="explore-section__note">
                        Featured races now own the hero. The center surface
                        underneath stays focused on what athletes can actually
                        enter next.
                    </p>
                </div>
                <div className="explore-race-grid">
                    {nearbyRaceItems.map((race) => (
                        <article className="explore-race" key={race.title}>
                            <img alt={race.title} src={race.image} />
                            <div className="explore-race__body">
                                <div className="explore-race__topline">
                                    <span>{race.venue}</span>
                                    <strong>{race.date}</strong>
                                </div>
                                <h3>{race.title}</h3>
                                <p>
                                    Built for nearby discovery, credible race
                                    presentation, and a cleaner entry point into
                                    real race weekends.
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="explore-section explore-section--events">
                <div className="explore-section__heading">
                    <p className="feed-label">Recommended</p>
                    <h2>
                        Suggested next for runners already comparing serious
                        events.
                    </h2>
                </div>
                <div className="explore-race-grid">
                    {recommendedRaceItems.map((race) => (
                        <article className="explore-race" key={race.title}>
                            <img alt={race.title} src={race.image} />
                            <div className="explore-race__body">
                                <div className="explore-race__topline">
                                    <span>{race.venue}</span>
                                    <strong>{race.date}</strong>
                                </div>
                                <h3>{race.title}</h3>
                                <p>
                                    Recommended for athletes who care about
                                    strong organization, cleaner flow, and a
                                    more serious race tone.
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="explore-section explore-section--events">
                <div className="explore-section__heading">
                    <p className="feed-label">Upcoming events</p>
                    <h2>
                        A denser lane for schedules, drops, and operational
                        windows.
                    </h2>
                </div>
                <div className="explore-events-list">
                    {upcomingEventItems.map((event) => (
                        <article className="explore-event" key={event.title}>
                            <div className="explore-event__stamp">
                                <span>{event.date}</span>
                                <strong>{event.time}</strong>
                            </div>
                            <div className="explore-event__body">
                                <h3>{event.title}</h3>
                                <p>{event.detail}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}

function CommunityCenter() {
    return (
        <div className="community-center">
            <section className="community-hero" aria-label="Community header">
                <img
                    alt="Race discovery header"
                    className="community-hero__image"
                    src={communityHero.image}
                />
                <div className="community-hero__overlay" />
                <div className="community-hero__content">
                    <p className="feed-label">{communityHero.eyebrow}</p>
                    <h1>{communityHero.title}</h1>
                    <p>{communityHero.detail}</p>
                </div>
            </section>

            <section className="community-section">
                <div className="community-section__heading">
                    <p className="feed-label">Organizations</p>
                    <h2>The teams and clubs shaping the race calendar.</h2>
                </div>
                <div className="community-org-grid">
                    {organizationItems.map((item) => (
                        <article className="community-org-card" key={item.name}>
                            <div className="community-org-card__mark">
                                <img alt={item.name} src={item.image} />
                            </div>
                            <div className="community-org-card__body">
                                <h3>{item.name}</h3>
                                <p>{item.type}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="community-section">
                <div className="community-section__heading community-section__heading--split">
                    <div>
                        <p className="feed-label">People</p>
                        <h2>
                            Heads behind the clubs, crews, and race weekends.
                        </h2>
                    </div>
                    <p className="community-section__note">
                        Community now serves people and organizations only, not
                        race discovery. The tone stays disciplined and useful.
                    </p>
                </div>
                <div className="community-people-grid">
                    {peopleItems.map((item) => (
                        <article
                            className="community-person-card"
                            key={item.name}
                        >
                            <div className="community-person-card__image-wrap">
                                <img alt={item.name} src={item.image} />
                            </div>
                            <div className="community-person-card__body">
                                <h3>{item.name}</h3>
                                <p>{item.role}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
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
                {sessionDisplayName}, this state is ready for the future `/feed`
                response. For now, you can repopulate the mocked stream or post
                the first update from the composer.
            </p>
            <div className="feed-empty__actions">
                <button
                    className="button button--primary"
                    onClick={onResetFeed}
                    type="button"
                >
                    Restore sample feed
                </button>
                <button
                    className="button button--ghost"
                    onClick={onStartRaceDraft}
                    type="button"
                >
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
                            <p className="eyebrow">
                                For runners, cyclists, and race organizers
                            </p>
                            <div className="hero__headline">
                                <span className="hero__headline-kicker">
                                    Race registration
                                </span>
                                <h1>
                                    <span className="hero__headline-accent">
                                        Built for
                                    </span>
                                    <span>the serious side</span>
                                    <span>of movement.</span>
                                </h1>
                            </div>
                        </div>

                        <div className="hero__rail">
                            <div
                                className="hero__thumbs"
                                aria-label="RunHop race moments"
                            >
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
                                    RunHop gives organizers a credible place to
                                    present races, sell registrations, and
                                    release updates while giving committed
                                    athletes one disciplined platform to
                                    discover events and move with a real
                                    community.
                                </p>
                                <div className="hero__actions">
                                    <a
                                        className="button button--primary"
                                        href="#races"
                                    >
                                        Explore races
                                    </a>
                                    <a
                                        className="button button--ghost"
                                        href="#organizers"
                                    >
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
                        <h2>
                            Upcoming events that look as serious as the people
                            signing up.
                        </h2>
                        <p>
                            The first marketing surface should prove one thing
                            fast: RunHop is where races can be presented with
                            authority, clarity, and enough editorial weight to
                            earn trust.
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
                                    <Link to="/register">
                                        Register interest
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="section section--dark" id="community">
                    <div className="community-grid">
                        <div className="community-grid__copy">
                            <p className="eyebrow">Social running groups</p>
                            <h2>
                                A stronger community without the tone of a
                                playful fitness app.
                            </h2>
                            <p>
                                Social features still need discipline. The right
                                tone is not casual noise, it is structure,
                                rhythm, and people finding the right crew to run
                                with.
                            </p>
                        </div>
                        <div className="community-grid__visual">
                            <img
                                src={imageSources.groupA}
                                alt="A running community on a boardwalk"
                            />
                            <img
                                src={imageSources.groupB}
                                alt="Runners grouped together after a training session"
                            />
                        </div>
                    </div>

                    <div className="community-list">
                        {communities.map((community) => (
                            <article
                                className="community-list__item"
                                key={community.name}
                            >
                                <div>
                                    <p className="community-list__place">
                                        {community.location}
                                    </p>
                                    <h3>{community.name}</h3>
                                </div>
                                <p>{community.detail}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section
                    className="section section--organizers"
                    id="organizers"
                >
                    <div className="organizer-panel">
                        <div className="organizer-panel__copy">
                            <p className="eyebrow eyebrow--dark">
                                For race organizers
                            </p>
                            <h2>
                                Present your races with authority, not
                                marketplace clutter.
                            </h2>
                            <p>
                                RunHop is built for organizers who want an event
                                page that feels premium enough to sell on, clear
                                enough to trust, and structured enough to keep
                                athletes informed from announcement to race day.
                            </p>
                            <ul className="organizer-points">
                                <li>
                                    Premium race pages for registrations and
                                    announcements
                                </li>
                                <li>
                                    Merch, add-ons, and supporting updates in
                                    one flow
                                </li>
                                <li>
                                    Clear information architecture for serious
                                    event buyers
                                </li>
                            </ul>
                        </div>
                        <div className="organizer-panel__stats">
                            <article>
                                <span>01</span>
                                <h3>Event-led selling</h3>
                                <p>
                                    Registration, merch, and logistics stay
                                    under the same credible surface.
                                </p>
                            </article>
                            <article>
                                <span>02</span>
                                <h3>Trust by design</h3>
                                <p>
                                    Strong hierarchy, clean copy, and
                                    disciplined emphasis where buyers need it
                                    most.
                                </p>
                            </article>
                            <article>
                                <span>03</span>
                                <h3>Community carryover</h3>
                                <p>
                                    Events do not disappear after checkout, they
                                    keep a social and update layer attached.
                                </p>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="section section--updates" id="updates">
                    <div className="section__intro section__intro--compact">
                        <p className="eyebrow eyebrow--dark">
                            Latest news and merch
                        </p>
                        <h2>
                            Updates that keep the platform active between race
                            weekends.
                        </h2>
                    </div>

                    <div className="updates-grid">
                        {updates.map((update) => (
                            <article className="update-card" key={update.title}>
                                <p className="update-card__category">
                                    {update.category}
                                </p>
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

            const session =
                mode === 'register'
                    ? await register(payload)
                    : await login(payload);

            await onSessionChange(session);
            navigate('/', { replace: true });
        } catch (error) {
            setStatus({
                submitting: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unable to continue.',
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
                        <p>
                            Serious race participation deserves a serious
                            product surface.
                        </p>
                    </div>
                </section>

                <section className="auth-card">
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-form__intro">
                            <p className="auth-form__eyebrow">
                                {mode === 'register'
                                    ? 'New account'
                                    : 'Member access'}
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
                                    mode === 'register'
                                        ? 'new-password'
                                        : 'current-password'
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

                        <button
                            className="button button--primary auth-form__submit"
                            type="submit"
                        >
                            {status.submitting ? 'Working...' : buttonLabel}
                        </button>

                        <p className="auth-form__hint">
                            {altLinkLabel}{' '}
                            <Link to={altLinkTo}>{altLinkAction}</Link>
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
