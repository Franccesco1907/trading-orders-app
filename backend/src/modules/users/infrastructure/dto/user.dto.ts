import { UserRole } from "@modules/users/domain/entities";

export class UserDto {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date | null;
}