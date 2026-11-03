import { useState } from 'react';
import type { MotifTag } from '../../explain/types';
import { DrillScreen } from './DrillScreen';
import { GamesScreen } from './GamesScreen';
import { PlayScreen } from './PlayScreen';
import { ReportScreen } from './ReportScreen';
import { ReviewScreen } from './ReviewScreen';
import { SettingsScreen } from './SettingsScreen';

type Tab = 'play' | 'drills' | 'games' | 'report' | 'settings';
type Route = { name: Tab } | { name: 'review'; gameId: number };

export function App(): React.JSX.Element {
  const [route, setRoute] = useState<Route>({ name: 'play' });
  const [drillTag, setDrillTag] = useState<MotifTag | null>(null);
  const tab = (name: Tab, label: string): React.JSX.Element => (
    <button
      className={route.name === name ? 'tab active' : 'tab'}
      onClick={() => {
        if (name === 'drills') setDrillTag(null);
        setRoute({ name });
      }}
    >
      {label}
    </button>
  );
  const review = (gameId: number): void => setRoute({ name: 'review', gameId });
  return (
    <div className="app">
      <nav className="nav">
        <span className="logo">♞ Blunderwise</span>
        {tab('play', 'Play')}
        {tab('drills', 'Drills')}
        {tab('games', 'Games')}
        {tab('report', 'Report')}
        {tab('settings', 'Settings')}
      </nav>
      <main className="content">
        {/* Keep the game alive while visiting other tabs */}
        <div style={{ display: route.name === 'play' ? 'contents' : 'none' }}>
          <PlayScreen onReview={review} />
        </div>
        {route.name === 'drills' && <DrillScreen tag={drillTag} onClearTag={() => setDrillTag(null)} />}
        {route.name === 'games' && <GamesScreen onReview={review} />}
        {route.name === 'report' && (
          <ReportScreen
            onDrill={(tag) => {
              setDrillTag(tag);
              setRoute({ name: 'drills' });
            }}
          />
        )}
        {route.name === 'settings' && <SettingsScreen />}
        {route.name === 'review' && <ReviewScreen gameId={route.gameId} onBack={() => setRoute({ name: 'games' })} />}
      </main>
    </div>
  );
}
