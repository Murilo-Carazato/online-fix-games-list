/**
 * EmptyState — reusable placeholder rendered inside a section
 * when the game lacks data for that field.
 *
 * Keeps sections always visible (UX requirement) while clearly
 * communicating the absence of data. DRY: used across all GameDetails sub-components.
 */
interface EmptyStateProps {
    message?: string;
}

export function EmptyState({ message = 'No information available for this game.' }: EmptyStateProps) {
    return (
        <div className="flex items-center gap-2 text-slate-500 italic text-sm py-2 select-none">
            <span>ℹ️</span>
            <span>{message}</span>
        </div>
    );
}
