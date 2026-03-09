// ─── Shared domain-aligned types for the Web presentation layer ──────────────
// These mirror the domain contracts from backend-core without coupling to infra.

import type { SortKey, PaginatedQueryProps, AdvancedFilters } from '@hydra/backend-core';

export type { SortKey, AdvancedFilters };

export type SortDirection = NonNullable<PaginatedQueryProps['sortDirection']>;

export interface GameStats {
    total: number;
    wantToPlay: number;
    ignored: number;
}
