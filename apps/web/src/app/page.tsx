import GameDashboard from '@/components/GameDashboard';
import { getAllPreferences } from '@/actions/gameActions';
import type { EnrichedGame } from '@hydra/core-domain';

export default async function HomePage() {
  const res = await fetch('https://hydralinks.pages.dev/sources/onlinefix.json', { next: { revalidate: 3600 } });
  const data = await res.json();
  const rawGames: EnrichedGame[] = data.downloads || [];

  const prefs = await getAllPreferences();
  const wantSet = prefs.filter(p => p.wantToPlay).map(p => p.title);
  const ignoredSet = prefs.filter(p => p.ignored).map(p => p.title);

  return (
    <GameDashboard
      initialGames={rawGames}
      initialWantSet={wantSet}
      initialIgnoredSet={ignoredSet}
    />
  );
}
