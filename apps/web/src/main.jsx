import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MarketingPage />} />
        <Route
          path="/login"
          element={
            <AuthPage
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
              eyebrow="Create your account"
              title="Register for RunHop"
              description="Join the platform where race discovery, premium event presentation, and serious community start from one account."
              buttonLabel="Create account"
              fields={['name', 'email', 'password', 'role']}
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

function SiteFrame({ children, inverse = false }) {
  const location = useLocation();
  const inHome = location.pathname === '/';
  const sectionHref = (hash) => (inHome ? hash : `/${hash}`);

  return (
    <div className={inverse ? 'site-shell site-shell--inverse' : 'site-shell'}>
      <header className="topbar">
        <Link className="brand" to="/" aria-label="RunHop homepage">
          <span className="brand__mark" aria-hidden="true">
            RH
          </span>
          <span className="brand__word">
            RunHop
            <small>Race and community platform</small>
          </span>
        </Link>
        <nav className="topbar__nav" aria-label="Primary">
          <a href={sectionHref('#races')}>Races</a>
          <a href={sectionHref('#community')}>Community</a>
          <a href={sectionHref('#organizers')}>Organizers</a>
          <a href={sectionHref('#updates')}>Updates</a>
        </nav>
        <div className="topbar__actions">
          <Link className="text-action" to="/login">
            Login
          </Link>
          <Link className="text-action text-action--strong" to="/register">
            Register
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}

function MarketingPage() {
  return (
    <SiteFrame>
      <main>
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow">For runners, cyclists, and race organizers</p>
            <div className="hero__headline">
              <span className="hero__headline-kicker">Race registration</span>
              <h1>Built for the serious side of movement.</h1>
            </div>
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
            <ul className="hero__meta" aria-label="Key strengths">
              <li>Trusted race presentation</li>
              <li>Disciplined community discovery</li>
              <li>Merch and update surfaces in one system</li>
            </ul>
          </div>

          <div className="hero__visual">
            <figure className="hero-card hero-card--primary">
              <img
                src={imageSources.athlete}
                alt="Marathon runners moving through a city course"
              />
              <figcaption>
                <span>Next major race window</span>
                <strong>May 21 to 24, 2026</strong>
              </figcaption>
            </figure>
            <aside className="hero-card hero-card--secondary">
              <p className="hero-card__label">Organizer spotlight</p>
              <h2>Sell registrations, race-day merch, and updates from one premium event page.</h2>
              <p>
                Built for organizations that want trust before volume, with the
                discipline to present details clearly and sell with authority.
              </p>
            </aside>
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
  eyebrow,
  title,
  description,
  buttonLabel,
  fields,
  altLinkLabel,
  altLinkTo,
  altLinkAction,
}) {
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
          <form className="auth-form">
            {fields.includes('name') ? (
              <label>
                <span>Full name</span>
                <input type="text" placeholder="Your name" />
              </label>
            ) : null}

            <label>
              <span>Email address</span>
              <input type="email" placeholder="you@example.com" />
            </label>

            <label>
              <span>Password</span>
              <input type="password" placeholder="Enter your password" />
            </label>

            {fields.includes('role') ? (
              <label>
                <span>Primary role</span>
                <select defaultValue="runner">
                  <option value="runner">Runner or cyclist</option>
                  <option value="organizer">Race organizer</option>
                  <option value="club">Community lead or club captain</option>
                </select>
              </label>
            ) : null}

            <button className="button button--primary" type="button">
              {buttonLabel}
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
