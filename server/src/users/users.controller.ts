import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';

class UserInfoDto {
  id: number;
  username: string;
  lastLoginAt: Date;
  lastLoginIp: string;
  createdAt: Date;
  updatedAt: Date;
}

@ApiTags('用户管理')
@Controller('auth')
@UseInterceptors(TransformInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册', description: '创建新用户账号' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'admin' },
        password: { type: 'string', example: '123456' }
      }
    }
  })
  @ApiResponse({ status: 201, description: '注册成功', type: Object })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  async register(@Body() registerDto: { username: string; password: string }) {
    return this.usersService.register(registerDto.username, registerDto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: '用户登录', description: '使用用户名和密码登录系统' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'admin' },
        password: { type: 'string', example: '123456' }
      }
    }
  })
  @ApiResponse({ status: 200, description: '登录成功', type: Object })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() loginDto: { username: string; password: string }, @Request() req) {
    return this.usersService.login(req.user);
  }

  @Get('user/info')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息', description: '获取当前登录用户的详细信息' })
  @ApiResponse({ status: 200, description: '获取成功', type: UserInfoDto })
  @ApiResponse({ status: 401, description: '未授权' })
  async getUserInfo(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    const { password, ...result } = user;
    return result;
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '退出登录', description: '注销当前用户的登录状态' })
  @ApiResponse({ status: 200, description: '退出成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async logout(@Request() req) {
    return { message: '退出成功' };
  }
}