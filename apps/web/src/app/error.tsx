'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service if available
        console.error("Global boundary caught an error:", error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center space-y-4">
                <p className="text-4xl" role="img" aria-label="Warning">⚠️</p>
                <div className="space-y-2">
                    <p className="text-foreground font-semibold text-xl">Erro inesperado</p>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        {error.message || "Tivemos um problema ao carregar a página principal. O servidor pode estar indisponível no momento."}
                    </p>
                </div>
                <button
                    onClick={() => reset()}
                    className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    );
}
