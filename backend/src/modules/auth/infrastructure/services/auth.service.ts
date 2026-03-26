// src/modules/auth/infrastructure/services/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@modules/auth/domain/entities';
import { UserEntity } from '@modules/users/domain/entities';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) { }

  async login(user: UserEntity): Promise<string> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async validateUserById(userId: string): Promise<UserEntity | null> {
    // Placeholder — real lookup is handled by JwtStrategy
    return null;
  }
}

