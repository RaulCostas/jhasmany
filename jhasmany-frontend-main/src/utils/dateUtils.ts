/**
 * Formats a date string or Date object to 'DD/MM/YYYY' format.
 * If the input is null or invalid, returns '-'.
 * 
 * @param date - The date to format (string 'YYYY-MM-DD' or Date object)
 * @returns formatted date string 'DD/MM/YYYY'
 */
export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return '-';

    const d = new Date(date);
    // Check if valid date
    if (isNaN(d.getTime())) return '-';

    // Heuristic: If string looks like a plain date, use extracted parts to avoid TZ issues.
    if (typeof date === 'string') {
        const datePart = date.split('T')[0];
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = datePart.split('-').map(Number);
            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        }
    }

    // For other inputs, format using America/Lima timezone to be consistent
    try {
        const formatter = new Intl.DateTimeFormat('es-PE', {
            timeZone: 'America/Lima',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const parts = formatter.formatToParts(d);
        const day = parts.find(p => p.type === 'day')?.value || '00';
        const month = parts.find(p => p.type === 'month')?.value || '00';
        const year = parts.find(p => p.type === 'year')?.value || '0000';
        return `${day}/${month}/${year}`;
    } catch (e) {
        const day = d.getUTCDate().toString().padStart(2, '0');
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }
};

/**
 * Returns the current date in 'YYYY-MM-DD' format, adjusted for the America/Lima timezone.
 * Useful for initializing <input type="date"> values.
 */
export const getLocalDateString = (): string => {
    try {
        const formatter = new Intl.DateTimeFormat('fr-CA', {
            timeZone: 'America/Lima',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(new Date());
    } catch (e) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().split('T')[0];
    }
};

/**
 * Formats a date string or Date object to 'DD/MM/YYYY HH:MM' format in America/Lima timezone.
 * 
 * @param date - The date to format
 * @returns formatted datetime string 'DD/MM/YYYY HH:MM'
 */
export const formatDateTime = (date: string | Date | undefined | null): string => {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    try {
        const formatter = new Intl.DateTimeFormat('es-PE', {
            timeZone: 'America/Lima',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const parts = formatter.formatToParts(d);
        const day = parts.find(p => p.type === 'day')?.value || '00';
        const month = parts.find(p => p.type === 'month')?.value || '00';
        const year = parts.find(p => p.type === 'year')?.value || '0000';
        const hour = parts.find(p => p.type === 'hour')?.value || '00';
        const minute = parts.find(p => p.type === 'minute')?.value || '00';

        return `${day}/${month}/${year} ${hour}:${minute}`;
    } catch (e) {
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
};
