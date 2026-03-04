import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Hook para gerenciar inputs que precisam de debounce antes de notificar componentes pais.
 * Mantém o estado local performático enquanto atrasa a chamada (Side Effect) principal.
 */
export function useDebouncedInput(
    initialValue: string,
    onDebounce: (value: string) => void,
    delay: number = 300
) {
    const [localValue, setLocalValue] = useState(initialValue);
    const debouncedValue = useDebounce(localValue, delay);

    useEffect(() => {
        onDebounce(debouncedValue);
    }, [debouncedValue, onDebounce]);

    return [localValue, setLocalValue] as const;
}
