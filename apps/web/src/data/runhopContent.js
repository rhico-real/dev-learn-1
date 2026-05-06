export const imageSources = {
    hero: 'https://images.unsplash.com/photo-1762709753339-7bd2fea1f346?auto=format&fit=crop&w=1600&q=80',
    raceA: 'https://images.unsplash.com/photo-1745790289741-12a211a8325d?auto=format&fit=crop&w=1200&q=80',
    raceB: 'https://images.unsplash.com/photo-1758429700970-fd082d9e5d1d?auto=format&fit=crop&w=1200&q=80',
    groupA: 'https://images.unsplash.com/photo-1769867627496-1a6b980d95cb?auto=format&fit=crop&w=1200&q=80',
    groupB: 'https://images.unsplash.com/photo-1769867628125-f79281f22023?auto=format&fit=crop&w=1200&q=80',
};

export const featuredRaces = [
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

export const communities = [
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

export const updates = [
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

export const feedNavigation = [
    { key: 'home', label: 'Home', meta: 'Primary feed' },
    { key: 'community', label: 'Community', meta: 'People and clubs' },
    { key: 'explore', label: 'Explore', meta: 'Explore races' },
    { key: 'merch', label: 'Merch', meta: 'Buy merch' },
    { key: 'saved', label: 'Saved', meta: 'Race watchlist' },
];

export const trendingRaces = [
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

export const initialFeedPosts = [
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

export const feedTabs = [
    { key: 'all', label: 'For You' },
    { key: 'races', label: 'Races & Orgs' },
];

export const exploreHeroSlides = [
    {
        eyebrow: 'Trackside release',
        title: '15% off with code Spring15',
        detail: 'A restrained merch window for race-day layers, premium travel pieces, and event-led drops that belong beside serious race listings.',
        image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80',
        cta: 'Shop now',
    },
];

export const bestSellerItems = [
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

export const hotRaceItems = [
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

export const upcomingEventItems = [
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

export const exploreCategories = [
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

export const featuredRaceSlides = [
    {
        eyebrow: 'Featured race weekend',
        title: 'EXPLORE RACE',
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
        title: 'EXPLORE RACES',
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
        title: 'EXPLORE RACE',
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

export const nearbyRaceItems = [
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

export const recommendedRaceItems = [
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

export const communityHero = {
    eyebrow: 'People and organizations',
    title: 'COMMUNITY',
    detail: 'Find organizing groups, captains, and committed athletes without turning the surface into a casual social feed.',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

export const organizationItems = [
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

export const peopleItems = [
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

export const createRaceToolbar = [
    { label: 'B', command: 'bold', title: 'Bold' },
    { label: 'I', command: 'italic', title: 'Italic' },
    { label: 'U', command: 'underline', title: 'Underline' },
    { label: 'S', command: 'strikeThrough', title: 'Strikethrough' },
    { label: 'H2', command: 'formatBlock', value: 'h2', title: 'Heading' },
    { label: 'H3', command: 'formatBlock', value: 'h3', title: 'Subheading' },
    {
        label: 'P',
        command: 'formatBlock',
        value: 'p',
        title: 'Paragraph',
    },
    {
        label: '• List',
        command: 'insertUnorderedList',
        title: 'Bullet list',
    },
    {
        label: '1. List',
        command: 'insertOrderedList',
        title: 'Numbered list',
    },
    {
        label: 'Quote',
        command: 'formatBlock',
        value: 'blockquote',
        title: 'Quote block',
    },
    {
        label: 'Align L',
        command: 'justifyLeft',
        title: 'Align left',
    },
    {
        label: 'Align C',
        command: 'justifyCenter',
        title: 'Align center',
    },
    {
        label: 'Align R',
        command: 'justifyRight',
        title: 'Align right',
    },
    { label: 'Link', command: 'createLink', title: 'Insert link' },
    { label: 'Undo', command: 'undo', title: 'Undo' },
    { label: 'Redo', command: 'redo', title: 'Redo' },
    {
        label: 'Clear',
        command: 'removeFormat',
        title: 'Clear formatting',
    },
];
