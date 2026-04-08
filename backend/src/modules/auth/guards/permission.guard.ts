import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../../database/entities/user.entity';
import { REQUIRE_ACTIONS_KEY } from '../decorators/require-actions.decorator';
import { PermissionsService } from '../permissions.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      REQUIRE_ACTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ user?: User }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    const ok = await this.permissions.userHasAllActions(
      user.id,
      user.role,
      required,
    );
    if (!ok) {
      throw new ForbiddenException(
        `Missing required action(s): ${required.join(', ')}`,
      );
    }
    return true;
  }
}
