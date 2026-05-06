const ORGANIZER_EVENTS_STORAGE_KEY = 'runhop.organizer-events';

function isQuotaExceededError(error) {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function normalizeRace(race) {
  if (!race || typeof race !== 'object') {
    return null;
  }

  const title = typeof race.title === 'string' ? race.title.trim() : '';

  if (!title) {
    return null;
  }

  return {
    id:
      typeof race.id === 'string' && race.id.trim()
        ? race.id.trim()
        : `race-${Date.now()}`,
    title,
    posterImage:
      typeof race.posterImage === 'string' ? race.posterImage : '',
    posterName:
      typeof race.posterName === 'string' ? race.posterName : '',
    orgLogoImage:
      typeof race.orgLogoImage === 'string' ? race.orgLogoImage : '',
    orgLogoName:
      typeof race.orgLogoName === 'string' ? race.orgLogoName : '',
    galleryImages: Array.isArray(race.galleryImages)
      ? race.galleryImages.filter((item) => typeof item === 'string')
      : [],
    galleryFiles: Array.isArray(race.galleryFiles)
      ? race.galleryFiles.filter((item) => typeof item === 'string')
      : [],
    headerMode:
      typeof race.headerMode === 'string' && race.headerMode.trim()
        ? race.headerMode.trim()
        : 'poster-title-logo',
    storyHtml:
      typeof race.storyHtml === 'string' && race.storyHtml.trim()
        ? race.storyHtml
        : '<p>Race details will appear here.</p>',
    createdAt:
      typeof race.createdAt === 'string' && race.createdAt.trim()
        ? race.createdAt.trim()
        : new Date().toISOString(),
  };
}

function normalizeEvent(event) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const name = typeof event.name === 'string' ? event.name.trim() : '';
  const description =
    typeof event.description === 'string' ? event.description.trim() : '';
  const location =
    typeof event.location === 'string' ? event.location.trim() : '';
  const startDate =
    typeof event.startDate === 'string' ? event.startDate.trim() : '';
  const endDate =
    typeof event.endDate === 'string' ? event.endDate.trim() : '';

  if (!name || !description || !location || !startDate || !endDate) {
    return null;
  }

  const idBase =
    typeof event.id === 'string' && event.id.trim()
      ? event.id.trim()
      : slugify(name);

  return {
    id: idBase || `event-${Date.now()}`,
    name,
    description,
    location,
    bannerImage:
      typeof event.bannerImage === 'string' ? event.bannerImage : '',
    bannerName:
      typeof event.bannerName === 'string' ? event.bannerName : '',
    startDate,
    endDate,
    createdAt:
      typeof event.createdAt === 'string' && event.createdAt.trim()
        ? event.createdAt.trim()
        : new Date().toISOString(),
    races: Array.isArray(event.races)
      ? event.races.map(normalizeRace).filter(Boolean)
      : [],
  };
}

export function loadOrganizerEvents() {
  const raw = window.localStorage.getItem(ORGANIZER_EVENTS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(ORGANIZER_EVENTS_STORAGE_KEY);
      return [];
    }

    return parsed.map(normalizeEvent).filter(Boolean);
  } catch {
    window.localStorage.removeItem(ORGANIZER_EVENTS_STORAGE_KEY);
    return [];
  }
}

export function saveOrganizerEvents(events) {
  const normalizedEvents = Array.isArray(events)
    ? events.map(normalizeEvent).filter(Boolean)
    : [];

  try {
    window.localStorage.setItem(
      ORGANIZER_EVENTS_STORAGE_KEY,
      JSON.stringify(normalizedEvents),
    );
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error(
        'Saved images are too large for this browser storage. Try smaller images or fewer gallery files.',
      );
    }

    throw error;
  }

  return normalizedEvents;
}

export function createOrganizerEvent(event) {
  const nextEvent = normalizeEvent(event);

  if (!nextEvent) {
    throw new Error('Invalid organizer event payload');
  }

  const currentEvents = loadOrganizerEvents();
  const hasConflict = currentEvents.some(
    (item) => item.id.toLowerCase() === nextEvent.id.toLowerCase(),
  );

  const resolvedEvent = hasConflict
    ? {
        ...nextEvent,
        id: `${nextEvent.id}-${Date.now()}`,
      }
    : nextEvent;

  const nextEvents = [resolvedEvent, ...currentEvents];
  saveOrganizerEvents(nextEvents);

  return resolvedEvent;
}

export function appendRaceToEvent(eventId, race) {
  const currentEvents = loadOrganizerEvents();
  const nextRace = normalizeRace(race);

  if (!nextRace) {
    throw new Error('Invalid race payload');
  }

  const nextEvents = currentEvents.map((event) =>
    event.id === eventId
      ? {
          ...event,
          races: [nextRace, ...event.races],
        }
      : event,
  );

  saveOrganizerEvents(nextEvents);
  return nextRace;
}
