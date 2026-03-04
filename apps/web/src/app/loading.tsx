export default function GlobalLoading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground text-lg animate-pulse" aria-live="polite">
                    Buscando os jogos em nossa biblioteca...
                </p>
            </div>
        </div>
    );
}
