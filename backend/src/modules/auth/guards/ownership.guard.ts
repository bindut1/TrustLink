import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { UserRole } from '../../../database/enums';
import {
  CHECK_OWNERSHIP_KEY,
  OwnershipConfig,
} from '../decorators/check-ownership.decorator';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<OwnershipConfig | undefined>(
      CHECK_OWNERSHIP_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!config) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<{ user?: User; params: Record<string, string> }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    // Admins bypass ownership checks.
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const paramName = config.paramName ?? 'id';
    const resourceId = req.params?.[paramName];
    if (!resourceId) {
      throw new BadRequestException(`Missing route param: ${paramName}`);
    }

    // Resolve the entity metadata by either entity name or table name.
    const meta = this.dataSource.entityMetadatas.find(
      (m) =>
        m.name.toLowerCase() === config.entity.toLowerCase() ||
        m.tableName.toLowerCase() === config.entity.toLowerCase(),
    );
    if (!meta) {
      throw new ForbiddenException(`Unknown entity: ${config.entity}`);
    }

    const repo = this.dataSource.getRepository(meta.target);
    const row = await repo
      .createQueryBuilder('e')
      .select(`e.${this.resolvePropertyName(meta, config.ownerColumn)}`, 'owner')
      .where('e.id = :id', { id: resourceId })
      .getRawOne<{ owner: string }>();

    if (!row) {
      throw new NotFoundException(`${config.entity} not found`);
    }
    if (row.owner !== user.id) {
      throw new ForbiddenException('You do not own this resource');
    }
    return true;
  }

  /** Map a snake_case DB column to its TypeORM property name. */
  private resolvePropertyName(
    meta: { columns: { propertyName: string; databaseName: string }[] },
    column: string,
  ): string {
    const col = meta.columns.find(
      (c) => c.databaseName === column || c.propertyName === column,
    );
    return col?.propertyName ?? column;
  }
}
