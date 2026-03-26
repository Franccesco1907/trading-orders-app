import { UserRole } from "@modules/users/domain/entities";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

