import { notFound } from 'next/navigation';
import { fetchGameDetailsAction } from '@/actions/gameActions';
import GameHero from '@/components/game-details/GameHero';
import GameStats from '@/components/game-details/GameStats';
import GameInfo from '@/components/game-details/GameInfo';
import GameMedia from '@/components/game-details/GameMedia';
import Link from 'next/link';

// Extract numeric ID from the slug. We passed it as `${id}-${slug}`
const extractId = (slug: string) => {
    const match = slug.match(/^(\d+)-/);
    return match ? parseInt(match[1], 10) : parseInt(slug, 10);
};

export default async function GameDetailsPage({ params }: { params: { id: string } }) {
    const id = extractId(params.id);
    if (isNaN(id)) return notFound();

    const { success, game, error } = await fetchGameDetailsAction(id);

    if (!success || !game) {
        console.error("Game details fetch error:", error);
        return notFound();
    }

    return (
        <main className="min-h-screen bg-[#0B0F19] overflow-x-hidden">
            {/* Custom glowing background effect — bleeds through tray margins */}
            <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/20 blur-[140px] rounded-full pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/20 blur-[140px] rounded-full pointer-events-none z-0" />

            {/* Blurred side columns — glow orbs show through here */}
            <div className="fixed inset-y-0 left-0 w-[8vw] backdrop-blur-md z-10 pointer-events-none" />
            <div className="fixed inset-y-0 right-0 w-[8vw] backdrop-blur-md z-10 pointer-events-none" />

            {/* Centered content tray */}
            <div className="relative z-20 mx-[8vw] min-h-screen">
                {/* Tray glass background */}
                <div className="absolute inset-0 bg-[#0B0F19]/80 backdrop-blur-sm border-x border-white/5 shadow-2xl pointer-events-none" />

                <div className="relative p-4 md:p-8 space-y-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Back link */}
                        <div className="mb-6">
                            <Link href="/" className="text-slate-400 hover:text-white transition flex items-center gap-2 w-max group">
                                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Games
                            </Link>
                        </div>

                        <GameHero game={game} />

                        <GameStats game={game} />

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
                            <div className="xl:col-span-1 space-y-8">
                                <GameInfo game={game} />
                            </div>
                            <div className="xl:col-span-2">
                                <GameMedia game={game} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
