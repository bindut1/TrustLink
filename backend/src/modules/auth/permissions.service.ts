import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Action } from '../../database/entities/action.entity';
import { RoleAction } from '../../database/entities/role-action.entity';
import { UserActionOverride } from '../../database/entities/user-action-override.entity';
import { UserRole } from '../../database/enums';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Action)
    private readonly actionRepo: Repository<Action>,
    @InjectRepository(RoleAction)
    private readonly roleActionRepo: Repository<RoleAction>,
    @InjectRepository(UserActionOverride)
    private readonly overrideRepo: Repository<UserActionOverride>,
  ) {}

  /**
   * Effective permission resolution per spec §3:
   *   override exists → use is_enabled directly
   *   no override     → fall back to role_actions for the user's role
   */
  async userHasAction(
    userId: string,
    role: UserRole,
    actionCode: string,
  ): Promise<boolean> {
    const action = await this.actionRepo.findOne({
      where: { code: actionCode },
    });
    if (!action) return false;

    const override = await this.overrideRepo.findOne({
      where: [
        { userId, actionId: action.id, expiresAt: IsNull() },
        { userId, actionId: action.id, expiresAt: MoreThan(new Date()) },
      ],
    });
    if (override) {
      return override.isEnabled;
    }

    const roleAction = await this.roleActionRepo.findOne({
      where: { role, actionId: action.id },
    });
    return !!roleAction;
  }

  async userHasAllActions(
    userId: string,
    role: UserRole,
    actionCodes: string[],
  ): Promise<boolean> {
    for (const code of actionCodes) {
      // Sequential is fine here — typical guard checks 1-2 actions.
      const ok = await this.userHasAction(userId, role, code);
      if (!ok) return false;
    }
    return true;
  }
}
