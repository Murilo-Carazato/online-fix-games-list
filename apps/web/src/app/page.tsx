import GameDashboard from '@/components/GameDashboard';
import { getAllPreferences } from '@/actions/gameActions';
import { PostgresGameDataRepository } from '@hydra/infrastructure';
import type { EnrichedGame } from '@hydra/core-domain';

export default async function HomePage() {
  const repo = new PostgresGameDataRepository();

  // We fetch the first 50 games from the database to prevent memory crashes on the client
  const games: EnrichedGame[] = await repo.getGamesPaginated({ limit: 50, offset: 0 });

  const prefs = await getAllPreferences();
  const wantSet = prefs.filter(p => p.wantToPlay).map(p => p.title);
  const ignoredSet = prefs.filter(p => p.ignored).map(p => p.title);

  return (
    <GameDashboard
      initialGames={games}
      initialWantSet={wantSet}
      initialIgnoredSet={ignoredSet}
    />
  );
}
