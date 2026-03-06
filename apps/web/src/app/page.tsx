import GameDashboard from '@/components/GameDashboard';
import { fetchInitialGamesAction } from '@/actions/gameActions';

// page.tsx has zero knowledge of infrastructure — all data comes via the service layer
export default async function HomePage() {
  const gamesRes = await fetchInitialGamesAction();

  const initialGames = gamesRes.success ? gamesRes.games : [];

  return (
    <GameDashboard
      initialGames={initialGames}
      initialStats={{ total: initialGames.length, wantToPlay: 0, ignored: 0 }}
    />
  );
}
