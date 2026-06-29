import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface TierWeights {
  keyword: number;
  semantic: number;
  verified: number;
}

const DEFAULT_WEIGHTS: TierWeights = {
  keyword: 0.4,
  semantic: 0.5,
  verified: 0.1,
};

@Injectable()
export class MatchingWeightsService {
  private readonly logger = new Logger(MatchingWeightsService.name);
  private weights: TierWeights = DEFAULT_WEIGHTS;
  private source = 'default';

  constructor() {
    this.load();
  }

  get(): TierWeights {
    return this.weights;
  }

  getSource(): string {
    return this.source;
  }

  private load(): void {
    const path =
      process.env.MATCH_WEIGHTS_PATH ||
      join(process.cwd(), 'config', 'match-weights.json');

    if (!existsSync(path)) {
      this.logger.log(
        `No weights file at ${path} — using baseline ${JSON.stringify(
          DEFAULT_WEIGHTS,
        )}`,
      );
      return;
    }

    try {
      const raw = JSON.parse(
        readFileSync(path, 'utf-8'),
      ) as Partial<TierWeights>;
      const parsed = {
        keyword: Number(raw.keyword),
        semantic: Number(raw.semantic),
        verified: Number(raw.verified),
      };
      const values = Object.values(parsed);
      if (values.some((v) => !Number.isFinite(v) || v < 0)) {
        throw new Error('weights must be finite and non-negative');
      }
      const sum = values.reduce((a, b) => a + b, 0);
      if (sum <= 0) throw new Error('weights sum to zero');
      this.weights = {
        keyword: parsed.keyword / sum,
        semantic: parsed.semantic / sum,
        verified: parsed.verified / sum,
      };
      this.source = 'learned';
      this.logger.log(
        `Loaded learned weights from ${path}: ${JSON.stringify(this.weights)}`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to load weights from ${path} (${String(err)}) — using baseline`,
      );
    }
  }
}
