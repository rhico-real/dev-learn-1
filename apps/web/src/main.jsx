import React, { useState } from 'react';
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
import { loadSession, login, register, saveSession } from './auth';
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
  athlete:
    'https://images.unsplash.com/photo-1762709753339-7bd2fea1f346?auto=format&fit=crop&w=900&q=80',
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

function App() {
  const initialSession = loadSession();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MarketingPage session={initialSession} />} />
        <Route
          path="/login"
          element={
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
            />
          }
        />
        <Route
          path="/register"
          element={
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
            />
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
  const headerClassName = inHome
    ? 'topbar topbar--hero'
    : inAuth
      ? 'topbar topbar--shell topbar--auth'
      : 'topbar topbar--shell';
  const brandClassName = inHome ? 'brand brand--hero' : 'brand brand--shell';
  const brandWordClassName = inHome ? 'brand__word brand__word--hero' : 'brand__word brand__word--shell';
  const navClassName = inHome ? 'topbar__nav topbar__nav--hero' : 'topbar__nav topbar__nav--shell';

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
          {inHome ? <a href={sectionHref('#top')}>Home</a> : null}
          <a href={sectionHref('#races')}>Races</a>
          <a href={sectionHref('#community')}>Community</a>
          <a href={sectionHref('#organizers')}>Organizers</a>
          <a href={sectionHref('#updates')}>Updates</a>
          {inHome && !session ? <Link to="/login">Login</Link> : null}
          {inHome && session ? <span className="topbar__session">{session.user.displayName}</span> : null}
          {inHome ? (
            session ? (
              <span className="topbar__nav-accent topbar__nav-accent--muted">Signed in</span>
            ) : (
              <Link className="topbar__nav-accent" to="/register">
                Join
              </Link>
            )
          ) : null}
        </nav>
        {inHome ? null : (
          <div className="topbar__actions">
            {session ? (
              <span className="topbar__session topbar__session--shell">{session.user.displayName}</span>
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
                  RunHop gives organizers a credible place to present races,
                  sell registrations, and release updates while giving
                  committed athletes one disciplined platform to discover events
                  and move with a real community.
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
              The first marketing surface should prove one thing fast: RunHop is
              where races can be presented with authority, clarity, and enough
              editorial weight to earn trust.
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
                Social features still need discipline. The right tone is not
                casual noise, it is structure, rhythm, and people finding the
                right crew to run with.
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
                <p>Registration, merch, and logistics stay under the same credible surface.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Trust by design</h3>
                <p>Strong hierarchy, clean copy, and disciplined emphasis where buyers need it most.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Community carryover</h3>
                <p>Events do not disappear after checkout, they keep a social and update layer attached.</p>
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

      saveSession(session);
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
            <p>
              Serious race participation deserves a serious product surface.
            </p>
          </div>
        </section>

        <section className="auth-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form__intro">
              <p className="auth-form__eyebrow">{mode === 'register' ? 'New account' : 'Member access'}</p>
              <h2>{buttonLabel}</h2>
            </div>

            {fields.includes('displayName') ? (
              <label>
                <span>Full name</span>
                <input
                  name="displayName"
                  type="text"
                  placeholder="Your name"
                  value={formState.displayName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </label>
            ) : null}

            <label>
              <span>Email address</span>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formState.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </label>

            <label>
              <span>Password</span>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formState.password}
                onChange={handleChange}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </label>

            {status.error ? <p className="auth-form__error">{status.error}</p> : null}

            <button className="button button--primary auth-form__submit" type="submit" disabled={status.submitting}>
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
