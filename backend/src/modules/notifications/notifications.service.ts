import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, Subject } from 'rxjs';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { NotificationType } from '../../database/enums';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: string | null;
  referenceId?: string | null;
}

@Injectable()
export class NotificationsService {
  // One Set of subjects per user — handles multiple tabs simultaneously.
  private readonly connections = new Map<string, Set<Subject<MessageEvent>>>();

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  // ───────────── SSE ─────────────

  subscribe(userId: string): {
    observable: Observable<MessageEvent>;
    cleanup: () => void;
  } {
    const subject = new Subject<MessageEvent>();
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(subject);

    // Heartbeat every 25s — keeps the connection alive through proxies/load
    // balancers that close idle connections after 30s.
    const heartbeat = setInterval(() => {
      subject.next({ data: ':heartbeat' } as MessageEvent);
    }, 25_000);

    return {
      observable: subject.asObservable(),
      cleanup: () => {
        clearInterval(heartbeat);
        const set = this.connections.get(userId);
        if (set) {
          set.delete(subject);
          if (set.size === 0) this.connections.delete(userId);
        }
        subject.complete();
      },
    };
  }

  private push(userId: string, notification: Notification): void {
    const subjects = this.connections.get(userId);
    if (!subjects) return;
    const event: MessageEvent = { data: notification };
    subjects.forEach((s) => s.next(event));
  }

  // ───────────── Core ─────────────

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = this.repo.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
    });
    const saved = await this.repo.save(notification);
    this.push(saved.userId, saved);
    return saved;
  }

  async broadcast(
    input: Omit<CreateNotificationInput, 'userId'>,
    userIds: string[],
  ): Promise<void> {
    if (userIds.length === 0) return;
    const notifications = userIds.map((userId) =>
      this.repo.create({
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
      }),
    );
    const saved = await this.repo.save(notifications);
    saved.forEach((n) => this.push(n.userId, n));
  }

  async findForUser(userId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { userId },
      order: { isRead: 'ASC', createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.repo.save(notification);
    }
    return notification;
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: () => 'NOW()' })
      .where('user_id = :userId AND is_read = false', { userId })
      .execute();
    return { updated: result.affected ?? 0 };
  }
}
