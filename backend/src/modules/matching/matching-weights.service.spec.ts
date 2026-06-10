import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { MatchingWeightsService } from './matching-weights.service';

describe('MatchingWeightsService', () => {
  let dir: string;
  let weightsPath: string;
  const originalEnv = process.env.MATCH_WEIGHTS_PATH;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'match-weights-'));
    weightsPath = join(dir, 'match-weights.json');
    process.env.MATCH_WEIGHTS_PATH = weightsPath;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    if (originalEnv === undefined) delete process.env.MATCH_WEIGHTS_PATH;
    else process.env.MATCH_WEIGHTS_PATH = originalEnv;
  });

  it('falls back to the baseline when no weights file exists', () => {
    const svc = new MatchingWeightsService();
    expect(svc.get()).toEqual({ keyword: 0.4, semantic: 0.5, verified: 0.1 });
    expect(svc.getSource()).toBe('default');
  });

  it('loads learned weights and normalizes them to sum 1', () => {
    writeFileSync(
      weightsPath,
      JSON.stringify({ keyword: 2, semantic: 2, verified: 1 }),
    );
    const svc = new MatchingWeightsService();
    expect(svc.get()).toEqual({ keyword: 0.4, semantic: 0.4, verified: 0.2 });
    expect(svc.getSource()).toBe('learned');
  });

  it('keeps already-normalized weights unchanged', () => {
    writeFileSync(
      weightsPath,
      JSON.stringify({ keyword: 0.3, semantic: 0.6, verified: 0.1 }),
    );
    const svc = new MatchingWeightsService();
    const w = svc.get();
    expect(w.keyword).toBeCloseTo(0.3);
    expect(w.semantic).toBeCloseTo(0.6);
    expect(w.verified).toBeCloseTo(0.1);
  });

  it('falls back when the file is not valid JSON', () => {
    writeFileSync(weightsPath, 'not json {');
    const svc = new MatchingWeightsService();
    expect(svc.get()).toEqual({ keyword: 0.4, semantic: 0.5, verified: 0.1 });
    expect(svc.getSource()).toBe('default');
  });

  it('falls back when a weight is missing or not a number', () => {
    writeFileSync(
      weightsPath,
      JSON.stringify({ keyword: 0.5, semantic: 'high' }),
    );
    const svc = new MatchingWeightsService();
    expect(svc.get()).toEqual({ keyword: 0.4, semantic: 0.5, verified: 0.1 });
    expect(svc.getSource()).toBe('default');
  });

  it('falls back when a weight is negative', () => {
    writeFileSync(
      weightsPath,
      JSON.stringify({ keyword: -0.2, semantic: 0.7, verified: 0.5 }),
    );
    const svc = new MatchingWeightsService();
    expect(svc.getSource()).toBe('default');
  });

  it('falls back when weights sum to zero', () => {
    writeFileSync(
      weightsPath,
      JSON.stringify({ keyword: 0, semantic: 0, verified: 0 }),
    );
    const svc = new MatchingWeightsService();
    expect(svc.get()).toEqual({ keyword: 0.4, semantic: 0.5, verified: 0.1 });
    expect(svc.getSource()).toBe('default');
  });
});
