import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../auth';
import { SiteFrame } from '../components/SiteFrame';
import {
    bestSellerItems,
    communities,
    communityHero,
    exploreHeroSlides,
    featuredRaceSlides,
    featuredRaces,
    imageSources,
    nearbyRaceItems,
    organizationItems,
    peopleItems,
    recommendedRaceItems,
    upcomingEventItems,
} from '../data/runhopContent';

export function MarketingPage({ session = null }) {
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
                        </div>
                    </div>
                </section>

                <section className="section section--updates" id="updates">
                    <div className="section__intro section__intro--compact">
                        <p className="eyebrow">Updates</p>
                        <h2>Recent platform signals.</h2>
                    </div>
                    <div className="updates-grid">
                        {[
                            {
                                title: 'Race updates stay attached to the event.',
                                category: 'Product',
                                copy: 'Every important detail should live where the athlete is already looking.',
                            },
                            {
                                title: 'Merch is part of the same story.',
                                category: 'Commerce',
                                copy: 'Add-ons, bundles, and support gear need the same editorial credibility as the event itself.',
                            },
                            {
                                title: 'Community is for people and crews.',
                                category: 'Social',
                                copy: 'The surface should help committed runners find the right group without losing discipline.',
                            },
                        ].map((item) => (
                            <article className="update-card" key={item.title}>
                                <p className="update-card__category">
                                    {item.category}
                                </p>
                                <h3>{item.title}</h3>
                                <p>{item.copy}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </SiteFrame>
    );
}

export function MerchCenter() {
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

export function ExploreCenter() {
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
                                key={`${item.title}-${index}`}
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
                    </div>
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

export function CommunityCenter() {
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
                    </div>
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

export function AuthPage({
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
