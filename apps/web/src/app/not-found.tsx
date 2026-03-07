// Custom 404 page that avoids the framer-motion SSR context issue
// when Next.js tries to pre-render the generic /_error page during static export.
export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center space-y-4">
                <p className="text-6xl font-bold text-foreground">404</p>
                <p className="text-muted-foreground text-lg">Página não encontrada</p>
                <a
                    href="/"
                    className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                >
                    Voltar para o início
                </a>
            </div>
        </div>
    );
}
