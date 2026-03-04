import GameDashboard from '@/components/GameDashboard';
import { getAllPreferences } from '@/actions/gameActions';
import type { EnrichedGame } from '@hydra/core-domain';

export default async function HomePage() {
  const res = await fetch('https://hydralinks.pages.dev/sources/onlinefix.json', { next: { revalidate: 3600 } });
  const data = await res.json();
  const rawGames: EnrichedGame[] = data.downloads || [];

  // Deduplicate by title — the source JSON may contain the same title multiple times
  // (different build dates). We keep only the last occurrence which is the most recent.
  const seen = new Map<string, EnrichedGame>();
  for (const game of rawGames) {
    seen.set(game.title, game);
  }
  const games = Array.from(seen.values());

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
