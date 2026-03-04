interface StatsHeaderProps {
    total: number;
    wantToPlay: number;
    ignored: number;
}

export function StatsHeader({ total, wantToPlay, ignored }: StatsHeaderProps) {
    return (
        <header className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                        <span className="text-primary">Hydra</span> Sorter
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Organize sua biblioteca de jogos da OnlineFix
                    </p>
                </div>

                <div className="flex gap-3">
                    <Stat label="Total" value={total} color="text-foreground" />
                    <Stat label="Quero jogar" value={wantToPlay} color="text-primary" />
                    <Stat label="Ignorados" value={ignored} color="text-red-400" />
                </div>
            </div>
        </header>
    );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-card border border-border rounded-xl px-4 py-2 text-center min-w-[80px]">
            <p className={`text-xl font-bold ${color}`}>{value.toLocaleString('pt-BR')}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
    );
}
