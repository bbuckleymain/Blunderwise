import { describe, expect, it } from 'vitest';
import { goCommand, parseBestMove, parseInfo } from '../engine/uci';

describe('uci parsing', () => {
  it('parses cp and pv', () => {
    const i = parseInfo('info depth 16 seldepth 20 multipv 1 score cp 37 nodes 80751 nps 646008 time 125 pv e2e4 e7e5 g1f3');
    expect(i).toEqual({ depth: 16, multipv: 1, cp: 37, mate: null, pv: ['e2e4', 'e7e5', 'g1f3'] });
  });
  it('parses mate and bounds', () => {
    expect(parseInfo('info depth 5 score mate -2 lowerbound pv h5f7')?.mate).toBe(-2);
  });
  it('ignores non-score info', () => {
    expect(parseInfo('info string NNUE evaluation using nn.nnue')).toBeNull();
  });
  it('parses bestmove', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4');
    expect(parseBestMove('bestmove (none)')).toBeNull();
    expect(parseBestMove('info depth 1')).toBeUndefined();
  });
  it('builds go commands', () => {
    expect(goCommand({ nodes: 1 })).toBe('go nodes 1');
    expect(goCommand({ depth: 16 })).toBe('go depth 16');
    expect(goCommand({ movetimeMs: 300 })).toBe('go movetime 300');
  });
});
