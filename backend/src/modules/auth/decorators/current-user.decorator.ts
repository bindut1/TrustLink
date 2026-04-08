import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '../../../database/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest<{ user: User }>();
    return req.user;
  },
);
