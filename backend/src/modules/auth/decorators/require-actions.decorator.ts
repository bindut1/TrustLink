import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ACTIONS_KEY = 'requireActions';

/**
 * Attach required action codes to a route handler or controller class.
 *
 * Example: `@RequireActions('credential.issue', 'credential.revoke')`
 *
 * The `PermissionGuard` reads this metadata and verifies the user has every
 * listed action via the hybrid RBAC resolver.
 */
export const RequireActions = (...actions: string[]) =>
  SetMetadata(REQUIRE_ACTIONS_KEY, actions);
