import { useState } from 'react';
import { GamesScreen } from './GamesScreen';
import { PlayScreen } from './PlayScreen';
import { ReviewScreen } from './ReviewScreen';
import { SettingsScreen } from './SettingsScreen';

type Route = { name: 'play' | 'games' | 'settings' } | { name: 'review'; gameId: number };

export function App(): React.JSX.Element {
  const [route, setRoute] = useState<Route>({ name: 'play' });
  const tab = (name: 'play' | 'games' | 'settings', label: string): React.JSX.Element => (
    <button className={route.name === name ? 'tab active' : 'tab'} onClick={() => setRoute({ name })}>
      {label}
    </button>
  );
  const review = (gameId: number): void => setRoute({ name: 'review', gameId });
  return (
    <div className="app">
      <nav className="nav">
        <span className="logo">♞ Blunderwise</span>
        {tab('play', 'Play')}
        {tab('games', 'Games')}
        {tab('settings', 'Settings')}
      </nav>
      <main className="content">
        {/* Keep the game alive while visiting other tabs */}
        <div style={{ display: route.name === 'play' ? 'contents' : 'none' }}>
          <PlayScreen onReview={review} />
        </div>
        {route.name === 'games' && <GamesScreen onReview={review} />}
        {route.name === 'settings' && <SettingsScreen />}
        {route.name === 'review' && <ReviewScreen gameId={route.gameId} onBack={() => setRoute({ name: 'games' })} />}
      </main>
    </div>
  );
}
