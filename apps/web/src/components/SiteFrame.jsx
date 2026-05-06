import { Link, useLocation } from 'react-router-dom';

export function SiteFrame({ children, inverse = false, session = null }) {
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
