import { UserRole } from '../../../database/enums';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
}
