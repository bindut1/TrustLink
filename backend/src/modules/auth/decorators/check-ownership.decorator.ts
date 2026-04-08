import { SetMetadata } from '@nestjs/common';

export const CHECK_OWNERSHIP_KEY = 'checkOwnership';

export interface OwnershipConfig {
  /** Entity table name (TypeORM entity name) — e.g. 'institution', 'job'. */
  entity: string;
  /** Column on the entity that holds the owning user_id — e.g. 'user_id'. */
  ownerColumn: string;
  /** Route param name that contains the entity id. Defaults to 'id'. */
  paramName?: string;
}

/**
 * Mark a route as requiring ownership of a resource. The OwnershipGuard
 * loads `entity` by `paramName` and checks `ownerColumn === request.user.id`.
 *
 * Example: `@CheckOwnership('institution', 'user_id')`
 */
export const CheckOwnership = (
  entity: string,
  ownerColumn: string,
  paramName: string = 'id',
) =>
  SetMetadata(CHECK_OWNERSHIP_KEY, {
    entity,
    ownerColumn,
    paramName,
  } satisfies OwnershipConfig);
