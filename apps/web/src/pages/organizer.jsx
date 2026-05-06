import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SiteFrame } from '../components/SiteFrame';
import {
    createRaceToolbar,
    imageSources,
} from '../data/runhopContent';
import { readImageAsDataUrl } from '../lib/file';
import {
    formatDisplayDate,
    formatEventDateRange,
} from '../lib/formatters';
import {
    appendRaceToEvent,
    createOrganizerEvent,
    loadOrganizerEvents,
} from '../organizerStorage';

export function OrganizerEventsPage({ session }) {
    const navigate = useNavigate();
    const [events, setEvents] = useState(() => loadOrganizerEvents());

    useEffect(() => {
        setEvents(loadOrganizerEvents());
    }, []);

    return (
        <SiteFrame session={session}>
            <main className="organizer-page">
                <nav className="organizer-route-rail" aria-label="Routes">
                    <span className="organizer-route-rail__item">Events</span>
                    <span className="organizer-route-rail__item">
                        List of events
                    </span>
                </nav>

                <section className="organizer-hero">
                    <div className="organizer-hero__copy">
                        <p className="feed-label">Organizer events</p>
                        <h1>Events first, races second.</h1>
                    </div>
                    <div className="organizer-hero__meta">
                        <article>
                            <span>{events.length}</span>
                            <p>Total events</p>
                        </article>
                        <article>
                            <span>
                                {events.reduce(
                                    (total, event) =>
                                        total + event.races.length,
                                    0,
                                )}
                            </span>
                            <p>Total races</p>
                        </article>
                    </div>
                </section>

                <section
                    className="organizer-grid"
                    aria-label="Organizer event list"
                >
                    <button
                        className="organizer-create-card"
                        onClick={() => navigate('/organizer/events/new')}
                        type="button"
                    >
                        <span className="organizer-create-card__plus">+</span>
                        <strong>Add event</strong>
                        <p>Create the next event.</p>
                    </button>

                    {events.length === 0 ? (
                        <article className="organizer-empty">
                            <h2>Your first event will appear here.</h2>
                        </article>
                    ) : null}

                    {events.map((event) => (
                        <button
                            className="organizer-event-card"
                            key={event.id}
                            onClick={() =>
                                navigate(`/organizer/events/${event.id}`)
                            }
                            type="button"
                        >
                            <div className="organizer-event-card__image">
                                {event.bannerImage ? (
                                    <img
                                        alt={event.name}
                                        src={event.bannerImage}
                                    />
                                ) : (
                                    <div className="organizer-event-card__fallback" />
                                )}
                            </div>
                            <div className="organizer-event-card__body">
                                <h2>{event.name}</h2>
                                <p>{event.location}</p>
                                <span>{event.races.length} races</span>
                            </div>
                        </button>
                    ))}
                </section>
            </main>
        </SiteFrame>
    );
}

function RaceCardImage({ alt, src }) {
    const [imageSrc, setImageSrc] = useState(src || '/logo.png');
    const isFallback = imageSrc === '/logo.png';

    useEffect(() => {
        setImageSrc(src || '/logo.png');
    }, [src]);

    return (
        <img
            alt={alt}
            className={
                isFallback
                    ? 'event-race-card__poster event-race-card__poster--fallback'
                    : 'event-race-card__poster'
            }
            onError={() => {
                if (imageSrc !== '/logo.png') {
                    setImageSrc('/logo.png');
                }
            }}
            src={imageSrc}
        />
    );
}

export function CreateEventPage({ session }) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [bannerName, setBannerName] = useState('');
    const [bannerPreviewUrl, setBannerPreviewUrl] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(
        () => () => {
            if (bannerPreviewUrl && bannerPreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(bannerPreviewUrl);
            }
        },
        [bannerPreviewUrl],
    );

    const handleBannerChange = async (event) => {
        const file = event.target.files?.[0];

        setBannerName(file ? file.name : '');
        if (bannerPreviewUrl && bannerPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(bannerPreviewUrl);
        }

        if (!file) {
            setBannerPreviewUrl('');
            return;
        }

        try {
            const dataUrl = await readImageAsDataUrl(file, {
                maxWidth: 1800,
                maxHeight: 1800,
                quality: 0.82,
            });
            setBannerPreviewUrl(dataUrl);
        } catch {
            setError('We could not read that banner image.');
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Please enter an event name.');
            return;
        }

        if (!description.trim()) {
            setError('Please add a short event description.');
            return;
        }

        if (!location.trim()) {
            setError('Please enter a location.');
            return;
        }

        if (!startDate || !endDate) {
            setError('Please set both a start date and an end date.');
            return;
        }

        setIsSaving(true);

        try {
            const event = createOrganizerEvent({
                name: name.trim(),
                description: description.trim(),
                location: location.trim(),
                bannerImage: bannerPreviewUrl,
                bannerName,
                startDate,
                endDate,
                races: [],
            });

            navigate(`/organizer/events/${event.id}`);
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : 'Unable to save this event.',
            );
            setIsSaving(false);
        }
    };

    return (
        <SiteFrame session={session}>
            <main className="create-race-page create-event-page">
                <section className="create-race-layout">
                    <aside className="create-race-preview">
                        <section className="create-race-preview__frame">
                            <div className="create-race-preview__hero create-event-preview__hero">
                                {bannerPreviewUrl ? (
                                    <img
                                        alt={name || 'Event banner preview'}
                                        className="create-race-preview__poster"
                                        src={bannerPreviewUrl}
                                    />
                                ) : (
                                    <div className="create-race-preview__poster-fallback" />
                                )}
                                <div className="create-race-preview__gradient" />
                                <div className="create-race-preview__overlay">
                                    <p className="feed-label">Featured event</p>
                                    <h2>
                                        {name.trim() ||
                                            'South Loop Endurance Weekend'}
                                    </h2>
                                </div>
                            </div>

                            <div className="create-race-preview__body">
                                <div className="create-race-preview__content">
                                    <h3>{name.trim() || 'Event preview'}</h3>
                                    <p>
                                        {description.trim() ||
                                            'Describe the event with enough clarity for athletes and organizers to trust the page.'}
                                    </p>
                                </div>
                                <div className="create-event-preview__details">
                                    <span>
                                        {location.trim() || 'Location pending'}
                                    </span>
                                    <span>
                                        {formatEventDateRange(
                                            startDate,
                                            endDate,
                                        )}
                                    </span>
                                    <span>
                                        {bannerName || 'Banner image optional'}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </aside>

                    <div className="create-race-form">
                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Event header</p>
                                <h2>
                                    Match the add-race structure, but for
                                    events.
                                </h2>
                            </div>
                            <label className="upload-dropzone">
                                <input
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(eventInput) => {
                                        void handleBannerChange(eventInput);
                                    }}
                                    type="file"
                                />
                                <span className="upload-dropzone__eyebrow">
                                    Banner image
                                </span>
                                <strong>
                                    {bannerName || 'Choose a banner image'}
                                </strong>
                                <small>
                                    Use a wide visual that anchors the event
                                    before athletes read the details.
                                </small>
                            </label>
                        </section>

                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Event name</p>
                                <h2>Name the event with authority.</h2>
                            </div>
                            <label className="create-race-field">
                                <span>Name</span>
                                <input
                                    onChange={(eventInput) =>
                                        setName(eventInput.target.value)
                                    }
                                    placeholder="South Loop Endurance Weekend"
                                    type="text"
                                    value={name}
                                />
                            </label>
                        </section>

                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Event details</p>
                                <h2>Give athletes the context they need.</h2>
                            </div>
                            <label className="create-race-field">
                                <span>Description</span>
                                <textarea
                                    className="create-event-textarea"
                                    onChange={(eventInput) =>
                                        setDescription(eventInput.target.value)
                                    }
                                    placeholder="Explain what makes the event worth committing to."
                                    rows={5}
                                    value={description}
                                />
                            </label>
                            <label className="create-race-field">
                                <span>Location</span>
                                <input
                                    onChange={(eventInput) =>
                                        setLocation(eventInput.target.value)
                                    }
                                    placeholder="Makati, Manila"
                                    type="text"
                                    value={location}
                                />
                            </label>
                            <div className="create-event-dates">
                                <label className="create-race-field">
                                    <span>Start date</span>
                                    <input
                                        onChange={(eventInput) =>
                                            setStartDate(eventInput.target.value)
                                        }
                                        type="date"
                                        value={startDate}
                                    />
                                </label>
                                <label className="create-race-field">
                                    <span>End date</span>
                                    <input
                                        onChange={(eventInput) =>
                                            setEndDate(eventInput.target.value)
                                        }
                                        type="date"
                                        value={endDate}
                                    />
                                </label>
                            </div>
                        </section>
                    </div>

                    <aside className="create-race-sidebar">
                        <section className="create-race-panel">
                            <div className="create-race-panel__heading">
                                <p className="feed-label">Save event</p>
                                <h2>Once saved, races can branch from here.</h2>
                            </div>
                            <p className="create-race-sidebar__copy">
                                The event becomes the container for multiple
                                races, so the first save should be the event
                                itself.
                            </p>
                            {error ? (
                                <p
                                    className="create-race-sidebar__error"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            ) : null}
                            <button
                                className="button button--primary"
                                disabled={isSaving}
                                onClick={handleSubmit}
                                type="button"
                            >
                                {isSaving ? 'Saving...' : 'Create event'}
                            </button>
                        </section>

                        <section className="create-race-panel create-race-panel--summary">
                            <p className="feed-label">Preview rhythm</p>
                            <ul className="create-race-summary">
                                <li>Banner first, then name, then details.</li>
                                <li>
                                    Dates and location stay visible in the
                                    preview.
                                </li>
                                <li>
                                    The saved event becomes the parent for
                                    future races.
                                </li>
                            </ul>
                        </section>
                    </aside>
                </section>
            </main>
        </SiteFrame>
    );
}

export function OrganizerEventDetailPage({ session }) {
    const navigate = useNavigate();
    const { eventId } = useParams();
    const [events, setEvents] = useState(() => loadOrganizerEvents());
    const [activeView, setActiveView] = useState('upcoming');

    useEffect(() => {
        setEvents(loadOrganizerEvents());
    }, []);

    const event = events.find((item) => item.id === eventId);

    const now = new Date();
    const startDate = event ? new Date(event.startDate) : null;
    const endDate = event ? new Date(event.endDate) : null;
    const eventView =
        startDate && endDate
            ? now < startDate
                ? 'upcoming'
                : now > endDate
                  ? 'past'
                  : 'live'
            : 'upcoming';

    useEffect(() => {
        setActiveView(eventView);
    }, [eventView, eventId]);

    if (!event) {
        return (
            <SiteFrame session={session}>
                <main className="coming-soon-page">
                    <section className="coming-soon-panel">
                        <p className="feed-label">Event missing</p>
                        <h1>This event could not be found.</h1>
                        <p>
                            The record may not exist yet or it may have been
                            saved under a different draft. Return to the event
                            list and open the correct event.
                        </p>
                        <Link
                            className="button button--primary"
                            to="/organizer/events"
                        >
                            Back to events
                        </Link>
                    </section>
                </main>
            </SiteFrame>
        );
    }
    const visibleRaces = activeView === eventView ? event.races : [];

    return (
        <SiteFrame session={session}>
            <main className="event-detail-page">
                <nav className="organizer-route-rail" aria-label="Routes">
                    <Link
                        className="organizer-route-rail__item"
                        to="/organizer/events"
                    >
                        Events
                    </Link>
                    <span className="organizer-route-rail__item">
                        {event.name}
                    </span>
                    <span className="organizer-route-rail__item">Races</span>
                </nav>

                <section className="event-detail-stage">
                    <div className="event-detail-stage__hero-surface">
                        <div className="event-detail-stage__hero">
                            {event.bannerImage ? (
                                <img
                                    alt={`${event.name} banner`}
                                    src={event.bannerImage}
                                />
                            ) : (
                                <div className="event-detail-stage__hero-fallback" />
                            )}
                        </div>
                    </div>
                    <div className="event-detail-shell">
                        <aside className="event-detail-sidebar">
                            <div className="event-detail-sidebar__copy">
                                <p className="feed-label">Event detail</p>
                                <h1>{event.name}</h1>
                                <p>{event.description}</p>
                            </div>

                            <div className="event-detail-sidebar__meta">
                                <article>
                                    <span>Location</span>
                                    <strong>{event.location}</strong>
                                </article>
                                <article>
                                    <span>Schedule</span>
                                    <strong>
                                        {formatEventDateRange(
                                            event.startDate,
                                            event.endDate,
                                        )}
                                    </strong>
                                </article>
                                <article>
                                    <span>Total races</span>
                                    <strong>{event.races.length}</strong>
                                </article>
                            </div>

                            <button
                                className="button button--primary event-detail-sidebar__cta"
                                onClick={() =>
                                    navigate(
                                        `/organizer/events/${event.id}/races/new`,
                                    )
                                }
                                type="button"
                            >
                                Add race
                            </button>
                        </aside>

                        <section className="event-detail-main">
                            <div
                                className="event-detail-switcher"
                                role="tablist"
                                aria-label="Race views"
                            >
                                {[
                                    { key: 'live', label: 'Happening now' },
                                    {
                                        key: 'upcoming',
                                        label: 'Upcoming races',
                                    },
                                    { key: 'past', label: 'Past Races' },
                                ].map((view) => (
                                    <button
                                        aria-selected={activeView === view.key}
                                        className={
                                            activeView === view.key
                                                ? 'event-detail-switcher__tab event-detail-switcher__tab--active'
                                                : 'event-detail-switcher__tab'
                                        }
                                        key={view.key}
                                        onClick={() => setActiveView(view.key)}
                                        role="tab"
                                        type="button"
                                    >
                                        {view.label}
                                        {view.key === eventView &&
                                        event.races.length > 0 ? (
                                            <span>{event.races.length}</span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>

                            {visibleRaces.length > 0 ? (
                                <div className="event-race-grid">
                                    {visibleRaces.map((race) => (
                                        <article
                                            className="event-race-card"
                                            key={race.id}
                                        >
                                            <div className="event-race-card__image">
                                                <RaceCardImage
                                                    alt={race.title}
                                                    src={race.posterImage}
                                                />
                                            </div>
                                            <div className="event-race-card__body">
                                                <h2>{race.title}</h2>
                                                <p>
                                                    {formatDisplayDate(
                                                        race.createdAt,
                                                    )}
                                                </p>
                                                <span>
                                                    {race.galleryFiles.length}{' '}
                                                    images
                                                </span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <article className="event-detail-empty">
                                    <h2>No races in this view yet.</h2>
                                    <p>
                                        This event currently has races only in{' '}
                                        {eventView === 'live'
                                            ? 'Happening now'
                                            : eventView === 'upcoming'
                                              ? 'Upcoming races'
                                              : 'Past Races'}
                                        .
                                    </p>
                                </article>
                            )}
                        </section>
                    </div>
                </section>
            </main>
        </SiteFrame>
    );
}

export function CreateRacePage({ session }) {
    const navigate = useNavigate();
    const { eventId } = useParams();
    const editorRef = useRef(null);
    const [events, setEvents] = useState(() => loadOrganizerEvents());
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
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setEvents(loadOrganizerEvents());
    }, []);

    useEffect(() => {
        if (editorRef.current && !editorRef.current.innerHTML.trim()) {
            editorRef.current.innerHTML = editorHtml;
        }
    }, []);

    const event = events.find((item) => item.id === eventId);

    const handlePosterChange = async (eventInput) => {
        const file = eventInput.target.files?.[0];
        setPosterName(file ? file.name : '');
        setPosterPreviewUrl(
            file
                ? await readImageAsDataUrl(file, {
                      maxWidth: 1400,
                      maxHeight: 1400,
                      quality: 0.82,
                  })
                : '',
        );
    };

    const handleOrgLogoChange = async (eventInput) => {
        const file = eventInput.target.files?.[0];
        setOrgLogoName(file ? file.name : '');
        setOrgLogoPreviewUrl(
            file
                ? await readImageAsDataUrl(file, {
                      maxWidth: 480,
                      maxHeight: 480,
                      quality: 0.88,
                  })
                : '',
        );
    };

    const handleGalleryChange = async (eventInput) => {
        const files = Array.from(eventInput.target.files ?? []);
        setGalleryFiles(files.map((file) => file.name));
        setGalleryPreviews(
            await Promise.all(
                files.map((file) =>
                    readImageAsDataUrl(file, {
                        maxWidth: 1200,
                        maxHeight: 1200,
                        quality: 0.8,
                    }),
                ),
            ),
        );
    };

    const handleToolbarAction = (command, value = null) => {
        editorRef.current?.focus();
        if (command === 'createLink') {
            const href = window.prompt('Enter link URL');

            if (!href) {
                return;
            }

            document.execCommand(command, false, href);
        } else if (command === 'formatBlock' && value) {
            document.execCommand(command, false, value);
        } else {
            document.execCommand(command, false);
        }
        setEditorHtml(editorRef.current?.innerHTML ?? '');
    };

    const handleEditorInput = () => {
        setEditorHtml(editorRef.current?.innerHTML ?? '');
    };

    if (!event) {
        return (
            <SiteFrame session={session}>
                <main className="coming-soon-page">
                    <section className="coming-soon-panel">
                        <p className="feed-label">Event missing</p>
                        <h1>Choose an event before creating a race.</h1>
                        <p>
                            The race authoring page now hangs off a specific
                            event. Start from the event list, open the event,
                            then create the race there.
                        </p>
                        <Link
                            className="button button--primary"
                            to="/organizer/events"
                        >
                            Back to events
                        </Link>
                    </section>
                </main>
            </SiteFrame>
        );
    }

    const previewTitle = raceTitle.trim() || 'South Loop 21K Weekend';
    const previewLogoSrc = orgLogoPreviewUrl || '/logo.png';
    const previewBodyHasContent = editorHtml.trim().length > 0;

    const handleSaveRace = (eventInput) => {
        eventInput.preventDefault();
        setError('');

        if (!raceTitle.trim()) {
            setError('Please enter a race title.');
            return;
        }

        setIsSaving(true);

        try {
            appendRaceToEvent(event.id, {
                title: raceTitle.trim(),
                posterImage: posterPreviewUrl,
                posterName,
                orgLogoImage: orgLogoPreviewUrl,
                orgLogoName,
                galleryImages: galleryPreviews,
                galleryFiles,
                headerMode,
                storyHtml: editorHtml,
            });

            navigate(`/organizer/events/${event.id}`);
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : 'Unable to save this race.',
            );
            setIsSaving(false);
        }
    };

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
                                            Race in {event.name}
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
                                <p className="feed-label">Event context</p>
                                <h2>Create a race inside {event.name}.</h2>
                            </div>
                            <p className="create-race-sidebar__copy">
                                This race will save into the selected event and
                                appear beneath it in the organizer view.
                            </p>
                        </section>

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
                                    onChange={(eventInput) =>
                                        setRaceTitle(eventInput.target.value)
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
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                            }}
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
                                <p className="feed-label">Save race</p>
                                <h2>Keep the race inside this event.</h2>
                            </div>
                            <p className="create-race-sidebar__copy">
                                When you save, the race becomes part of the
                                selected event and shows up in the event detail
                                page.
                            </p>
                            {error ? (
                                <p
                                    className="create-race-sidebar__error"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            ) : null}
                            <button
                                className="button button--primary"
                                disabled={isSaving}
                                onClick={handleSaveRace}
                                type="button"
                            >
                                {isSaving ? 'Saving...' : 'Save race'}
                            </button>
                            <button
                                className="button button--ghost"
                                onClick={() =>
                                    navigate(`/organizer/events/${event.id}`)
                                }
                                type="button"
                            >
                                Back to event
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
                                    Saved races attach to the selected event.
                                </li>
                            </ul>
                        </section>
                    </aside>
                </section>
            </main>
        </SiteFrame>
    );
}

export function MerchComingSoonPage({ session }) {
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
                    <Link
                        className="button button--primary"
                        to="/organizer/events"
                    >
                        Back to events
                    </Link>
                </section>
            </main>
        </SiteFrame>
    );
}
