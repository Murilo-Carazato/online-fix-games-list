import { useReducer, useCallback } from 'react';

export interface PreferencesStats {
    wantToPlay: number;
    ignored: number;
}

type PreferencesState = {
    wantSet: Set<string>;
    ignSet: Set<string>;
    prefStats: PreferencesStats;
};

type PreferencesAction =
    | { type: 'TOGGLE_WANT'; title: string }
    | { type: 'TOGGLE_IGN'; title: string };

function preferencesReducer(state: PreferencesState, action: PreferencesAction): PreferencesState {
    const { wantSet, ignSet, prefStats } = state;
    const { title } = action;

    const newWantSet = new Set(wantSet);
    const newIgnSet = new Set(ignSet);
    let newWantCount = prefStats.wantToPlay;
    let newIgnCount = prefStats.ignored;

    switch (action.type) {
        case 'TOGGLE_WANT': {
            if (wantSet.has(title)) {
                newWantSet.delete(title);
                newWantCount--;
            } else {
                newWantSet.add(title);
                newWantCount++;
                if (ignSet.has(title)) {
                    newIgnSet.delete(title);
                    newIgnCount--;
                }
            }
            break;
        }
        case 'TOGGLE_IGN': {
            if (ignSet.has(title)) {
                newIgnSet.delete(title);
                newIgnCount--;
            } else {
                newIgnSet.add(title);
                newIgnCount++;
                if (wantSet.has(title)) {
                    newWantSet.delete(title);
                    newWantCount--;
                }
            }
            break;
        }
        default:
            return state;
    }

    return {
        wantSet: newWantSet,
        ignSet: newIgnSet,
        prefStats: { wantToPlay: newWantCount, ignored: newIgnCount }
    };
}

// Manages the user's in-session "want to play" and "ignored" sets.
// These are client-only toggles — no server persistence (no async needed).
export function useGamePreferences(initialStats: PreferencesStats) {
    const [state, dispatch] = useReducer(preferencesReducer, {
        wantSet: new Set<string>(),
        ignSet: new Set<string>(),
        prefStats: initialStats
    });

    const toggleWantToPlay = useCallback((title: string) => {
        dispatch({ type: 'TOGGLE_WANT', title });
    }, []);

    const toggleIgnored = useCallback((title: string) => {
        dispatch({ type: 'TOGGLE_IGN', title });
    }, []);

    return {
        wantSet: state.wantSet,
        ignSet: state.ignSet,
        prefStats: state.prefStats,
        toggleWantToPlay,
        toggleIgnored
    };
}
