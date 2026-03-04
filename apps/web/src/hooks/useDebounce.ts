import { useState, useEffect } from 'react';

/**
 * Hook genérico para atrasar a atualização de um valor (debounce).
 * Útil para campos de busca onde não queremos disparar uma ação a cada tecla digitada.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
