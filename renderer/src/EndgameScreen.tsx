import { ENDGAMES, DRAW_SURVIVAL_MOVES, type EndgamePosition } from '../../endgames/positions';

export function EndgameScreen(props: { onStart: (e: EndgamePosition) => void }): React.JSX.Element {
  const group = (level: EndgamePosition['level'], title: string): React.JSX.Element => (
    <>
      <h2>{title}</h2>
      <div className="endgame-grid">
        {ENDGAMES.filter((e) => e.level === level).map((e) => (
          <div key={e.id} className="panel eg-card">
            <h3>{e.title}</h3>
            <div className="muted small">
              You play {e.playAs === 'w' ? 'White' : 'Black'} ·{' '}
              {e.goal === 'win' ? 'Goal: win' : `Goal: hold the draw for ${DRAW_SURVIVAL_MOVES} moves`}
            </div>
            <p>{e.idea}</p>
            <button className="primary" onClick={() => props.onStart(e)}>
              Practise
            </button>
          </div>
        ))}
      </div>
    </>
  );
  return (
    <div className="games-page">
      <div className="panel">
        <h2>Endgame trainer</h2>
        <p className="muted">
          Classic endings against full-strength Stockfish. Every position here has been checked: the wins really are wins and the draws really can be held, so if it goes wrong, the mistake is yours to find. The coach still stops you on blunders.
        </p>
      </div>
      {group('basic', 'Basic mates and pawn endings')}
      {group('intermediate', 'Key positions')}
    </div>
  );
}
