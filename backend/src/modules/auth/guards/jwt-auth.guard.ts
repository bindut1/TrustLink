import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Verifies the JWT, looks up the user, and ensures status='active'.
 * Attaches the User entity to `request.user` (handled by JwtStrategy.validate).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
