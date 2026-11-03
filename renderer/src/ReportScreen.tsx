import { useEffect, useState } from 'react';
import type { MotifTag } from '../../explain/types';
import type { GameRecord, LibraryProgress, ReportData } from '../../shared/api';
import { api } from './api';
import { MOTIF_LABEL, PHASE_LABEL } from './labels';

function Bar(props: { value: number; max: number; className?: string }): React.JSX.Element {
  const pct = props.max > 0 ? Math.max(2, Math.round((100 * props.value) / props.max)) : 0;
  return (
    <div className="bar-track">
      <div className={`bar-fill ${props.className ?? ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ReportScreen(props: { onDrill: (tag: MotifTag) => void }): React.JSX.Element {
  const [report, setReport] = useState<ReportData | null>(null);
  const [games, setGames] = useState<GameRecord[] | null>(null);
  const [progress, setProgress] = useState<LibraryProgress | null>(null);

  const load = async (): Promise<void> => {
    const [r, g] = await Promise.all([api().library.report(), api().games.list()]);
    setReport(r);
    setGames(g);
  };
  useEffect(() => {
    void load();
    return api().library.onProgress(setProgress);
  }, []);

  if (!report || !games) return <div className="panel">Loading…</div>;
  const unanalyzed = games.filter((g) => !g.analyzed).length;
  const analyzeAll = async (): Promise<void> => {
    setProgress({ game: 0, games: unanalyzed, move: 0, moves: 0 });
    await api().library.analyzeAll();
    setProgress(null);
    await load();
  };

  const mistakesAndBlunders = report.byClassification.mistake + report.byClassification.blunder;
  const tags = report.byTag.filter((t) => t.tag !== 'positionalLoss');
  const positional = report.byTag.find((t) => t.tag === 'positionalLoss');
  const maxTag = Math.max(0, ...report.byTag.map((t) => t.count));
  const maxPhase = Math.max(0, ...report.byPhase.map((p) => p.count));
  const top = tags[0];
  const perGame = (n: number): string => (report.gamesAnalyzed ? (n / report.gamesAnalyzed).toFixed(1) : '0');

  return (
    <div className="report">
      {(unanalyzed > 0 || progress) && (
        <div className="panel">
          {progress ? (
            <>
              <div>
                Analysing game {Math.min(progress.game + 1, progress.games)} of {progress.games}
                {progress.moves ? ` · move ${progress.move}/${progress.moves}` : ''}
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${progress.games ? Math.round((100 * (progress.game + (progress.moves ? progress.move / progress.moves : 0))) / progress.games) : 0}%` }} />
              </div>
            </>
          ) : (
            <div className="game-head">
              <span>{unanalyzed} game{unanalyzed === 1 ? '' : 's'} not analysed yet.</span>
              <button className="primary" onClick={() => void analyzeAll()}>Analyse now</button>
            </div>
          )}
        </div>
      )}

      {report.gamesAnalyzed === 0 ? (
        <div className="panel">
          <h2>Your weakness report</h2>
          <p className="muted">Play a game, or import your games in Games and analyse them. Your report appears here.</p>
        </div>
      ) : (
        <>
          <div className="stat-row">
            <div className="panel stat"><div className="stat-num">{report.gamesAnalyzed}</div><div className="muted">games analysed</div></div>
            <div className="panel stat"><div className="stat-num blunder">{perGame(report.byClassification.blunder)}</div><div className="muted">blunders per game</div></div>
            <div className="panel stat"><div className="stat-num mistake">{perGame(report.byClassification.mistake)}</div><div className="muted">mistakes per game</div></div>
            <div className="panel stat"><div className="stat-num inaccuracy">{perGame(report.byClassification.inaccuracy)}</div><div className="muted">inaccuracies per game</div></div>
          </div>

          {top && (
            <div className="panel headline-panel">
              <strong>Biggest leak: {MOTIF_LABEL[top.tag].toLowerCase()}</strong> — {Math.round((100 * top.count) / Math.max(1, mistakesAndBlunders))}% of your mistakes and blunders.{' '}
              {top.allowed >= top.missed ? 'Mostly ones you allowed your opponent.' : 'Mostly chances you missed yourself.'}
              <button className="primary" onClick={() => props.onDrill(top.tag)}>Drill these</button>
            </div>
          )}

          <div className="panel">
            <h2>What your mistakes and blunders were</h2>
            <table className="tag-table">
              <tbody>
                {tags.map((t) => (
                  <tr key={t.tag}>
                    <td className="tag-name">{MOTIF_LABEL[t.tag]}</td>
                    <td className="tag-bar"><Bar value={t.count} max={maxTag} /></td>
                    <td className="num">{t.count}</td>
                    <td className="muted small">{t.allowed} allowed · {t.missed} missed · {t.blunders} blunder{t.blunders === 1 ? '' : 's'}</td>
                    <td><button onClick={() => props.onDrill(t.tag)}>Drill</button></td>
                  </tr>
                ))}
                {positional && (
                  <tr>
                    <td className="tag-name">{MOTIF_LABEL.positionalLoss}</td>
                    <td className="tag-bar"><Bar value={positional.count} max={maxTag} className="dim" /></td>
                    <td className="num">{positional.count}</td>
                    <td className="muted small">no clear tactic found</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
            <p className="muted small">A mistake can have up to two themes, so the counts can add up to more than the number of mistakes.</p>
          </div>

          <div className="panel">
            <h2>When they happen</h2>
            <table className="tag-table">
              <tbody>
                {['opening', 'middlegame', 'endgame'].map((ph) => {
                  const p = report.byPhase.find((x) => x.phase === ph);
                  return (
                    <tr key={ph}>
                      <td className="tag-name">{PHASE_LABEL[ph]}</td>
                      <td className="tag-bar"><Bar value={p?.count ?? 0} max={maxPhase} /></td>
                      <td className="num">{p?.count ?? 0}</td>
                      <td className="muted small">{p?.blunders ?? 0} blunder{(p?.blunders ?? 0) === 1 ? '' : 's'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
