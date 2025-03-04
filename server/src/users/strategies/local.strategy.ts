import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UsersService } from '../users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.usersService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    return user;
  }
}