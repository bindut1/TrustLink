import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('AI_SERVICE_URL') ?? 'http://ai-service:8000'
    ).replace(/\/+$/, '');
    this.timeoutMs = parseInt(
      config.get<string>('AI_SERVICE_TIMEOUT_MS', '10000'),
      10,
    );
  }

  async encode(text: string): Promise<number[]> {
    const data = await this.post<{ embedding: number[] }>('/encode', { text });
    return data.embedding;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new ServiceUnavailableException(
          `AI service ${path} returned ${res.status}: ${text.slice(0, 200)}`,
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`AI service call failed (${path}): ${message}`);
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException(
        `AI service unreachable: ${message}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
