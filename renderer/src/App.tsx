import { useEffect, useState } from 'react';
import type { EndgamePosition } from '../../endgames/positions';
import type { MotifTag } from '../../explain/types';
import { api } from './api';
import { applyAppearance } from './appearance';
import { DrillScreen } from './DrillScreen';
import { EndgameScreen } from './EndgameScreen';
import { GamesScreen } from './GamesScreen';
import { PlayScreen, type EndgameLaunch } from './PlayScreen';
import { ReportScreen } from './ReportScreen';
import { ReviewScreen } from './ReviewScreen';
import { SettingsScreen } from './SettingsScreen';

type Tab = 'play' | 'drills' | 'endgames' | 'games' | 'report' | 'settings';
type Route = { name: Tab } | { name: 'review'; gameId: number };

export function App(): React.JSX.Element {
  const [route, setRoute] = useState<Route>({ name: 'play' });
  const [drillTag, setDrillTag] = useState<MotifTag | null>(null);
  const [drillOpening, setDrillOpening] = useState<string | null>(null);
  const [launch, setLaunch] = useState<EndgameLaunch | null>(null);

  useEffect(() => {
    void api().settings.get().then(applyAppearance);
  }, []);

  const tab = (name: Tab, label: string): React.JSX.Element => (
    <button
      className={route.name === name ? 'tab active' : 'tab'}
      onClick={() => {
        if (name === 'drills') {
          setDrillTag(null);
          setDrillOpening(null);
        }
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
        <span className="logo">
          <span className="logo-mark" aria-hidden="true">♞</span>
          <span className="wordmark">Blunderwise</span>
        </span>
        {tab('play', 'Play')}
        {tab('drills', 'Drills')}
        {tab('endgames', 'Endgames')}
        {tab('games', 'Games')}
        {tab('report', 'Report')}
        {tab('settings', 'Settings')}
      </nav>
      <main className="content">
        {/* Keep the game alive while visiting other tabs */}
        <div style={{ display: route.name === 'play' ? 'contents' : 'none' }}>
          <PlayScreen onReview={review} launch={launch} />
        </div>
        {route.name === 'drills' && (
          <DrillScreen
            tag={drillTag}
            opening={drillOpening}
            onClearTag={() => {
              setDrillTag(null);
              setDrillOpening(null);
            }}
          />
        )}
        {route.name === 'endgames' && (
          <EndgameScreen
            onStart={(e) => {
              setLaunch({ nonce: Date.now(), endgame: e });
              setRoute({ name: 'play' });
            }}
          />
        )}
        {route.name === 'games' && <GamesScreen onReview={review} />}
        {route.name === 'report' && (
          <ReportScreen
            onDrill={(tag) => {
              setDrillTag(tag);
              setDrillOpening(null);
              setRoute({ name: 'drills' });
            }}
            onDrillOpening={(family) => {
              setDrillOpening(family);
              setDrillTag(null);
              setRoute({ name: 'drills' });
            }}
          />
        )}
        {route.name === 'settings' && <SettingsScreen />}
        {route.name === 'review' && <ReviewScreen key={route.gameId} gameId={route.gameId} onBack={() => setRoute({ name: 'games' })} />}
      </main>
    </div>
  );
}
