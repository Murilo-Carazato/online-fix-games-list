import GameDashboard from '@/components/GameDashboard';
import { fetchInitialGamesAction, getGlobalStatsAction } from '@/actions/gameActions';

// page.tsx has zero knowledge of infrastructure — all data comes through the service layer
export default async function HomePage() {
  const [gamesRes, statsRes] = await Promise.all([
    fetchInitialGamesAction(),
    getGlobalStatsAction(),
  ]);

  const initialGames = gamesRes.success ? gamesRes.games : [];
  const initialStats = statsRes.success ? statsRes.stats! : { total: 0, wantToPlay: 0, ignored: 0 };

  return (
    <GameDashboard
      initialGames={initialGames}
      initialStats={initialStats}
    />
  );
}
