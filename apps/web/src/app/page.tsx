// Force server-side rendering on every request.
// Needed because fetchInitialGamesAction reads from the DB at runtime;
// static pre-rendering would attempt to call React context before hydration.
export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';
import { fetchInitialGamesAction } from '@/actions/gameActions';
import type { GameStats } from '@/types/game.types';
import type { GameViewModel } from '@/presenters/GameViewModel';

// GameDashboard contains framer-motion which is SSR-incompatible
const GameDashboard = nextDynamic(() => import('@/components/GameDashboard'), { ssr: false });

export default async function HomePage() {
  const gamesRes = await fetchInitialGamesAction();

  const initialGames: GameViewModel[] = gamesRes.success ? gamesRes.games : [];
  const initialStats: GameStats = { total: initialGames.length, wantToPlay: 0, ignored: 0 };

  return (
    <GameDashboard
      initialGames={initialGames}
      initialStats={initialStats}
    />
  );
}
