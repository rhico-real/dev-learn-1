export function formatDisplayDate(dateString) {
    if (!dateString) {
        return '';
    }

    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(parsedDate);
}

export function formatEventDateRange(startDate, endDate) {
    const startLabel = formatDisplayDate(startDate);
    const endLabel = formatDisplayDate(endDate);

    if (!startLabel && !endLabel) {
        return 'Dates pending';
    }

    if (startLabel && endLabel) {
        return `${startLabel} to ${endLabel}`;
    }

    return startLabel || endLabel;
}

export function formatRelativeTime(dateString, { prefix = '', suffix = 'ago' } = {}) {
    if (!dateString) {
        return prefix ? `${prefix} just now` : 'just now';
    }

    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
        return dateString;
    }

    const diffMs = Date.now() - parsedDate.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.max(0, Math.floor(diffMs / 3600000));
    const diffDays = Math.max(0, Math.floor(diffMs / 86400000));

    let value = 'just now';

    if (diffDays > 0) {
        value = `${diffDays}d`;
    } else if (diffHours > 0) {
        value = `${diffHours}h`;
    } else if (diffMinutes > 0) {
        value = `${diffMinutes}m`;
    }

    if (!prefix) {
        return suffix ? `${value} ${suffix}` : value;
    }

    if (value === 'just now') {
        return `${prefix} just now`;
    }

    return `${prefix} ${value} ${suffix}`.trim();
}
