/**
 * Utilitários puros para formatação de exibição na UI.
 * Livres de dependências do React.
 */

export function formatPopularity(n: number | null | undefined): string | null {
    if (n === null || n === undefined) return null;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

export function formatRating(totalRating: number | null | undefined): number | null {
    return totalRating ? Math.round(totalRating) : null;
}

export function formatUploadDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCFullYear()}`;
}
