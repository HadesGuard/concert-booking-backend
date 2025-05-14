import { Role } from '../enums/role.enum';

export interface JwtPayload {
  email: string;
  sub: string;
  roles: Role[];
}
