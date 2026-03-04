import { useEffect, useRef } from 'react';

/**
 * useIntersectionObserver
 *
 * A reusable hook that fires a callback when a target element enters the viewport.
 * Used to implement invisible-sentinel based infinite scroll, eliminating the need
 * for a manual "Load More" button.
 *
 * @param callback - Function to call when the sentinel becomes visible.
 * @param options  - Standard IntersectionObserver options (threshold, rootMargin, etc.)
 */
export function useIntersectionObserver(
    callback: () => void,
    options: IntersectionObserverInit = { threshold: 0.1 }
) {
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const callbackRef = useRef(callback);

    // Keep callback ref fresh without resetting the observer
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                callbackRef.current();
            }
        }, options);

        observer.observe(el);
        return () => observer.disconnect();
        // options is stable (object literal at call site is memoized by the caller if needed)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return sentinelRef;
}
