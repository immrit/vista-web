/**
 * Format relative time (e.g., "2 minutes ago", "yesterday")
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'همین الان';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} دقیقه پیش`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} ساعت پیش`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
        return 'دیروز';
    }
    if (diffInDays < 7) {
        return `${diffInDays} روز پیش`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks} هفته پیش`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} ماه پیش`;
    }

    return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format time for message timestamp (e.g., "14:30")
 */
export function formatMessageTime(dateString: string | null | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format date for message (e.g., "امروز", "دیروز", "15 دی")
 */
export function formatMessageDate(dateString: string | null | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffInDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
        return 'امروز';
    }
    if (diffInDays === 1) {
        return 'دیروز';
    }
    if (diffInDays < 7) {
        return date.toLocaleDateString('fa-IR', { weekday: 'long' });
    }

    return date.toLocaleDateString('fa-IR', {
        month: 'long',
        day: 'numeric',
    });
}

