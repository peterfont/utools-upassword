import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
    minLength: 6,
  })
  password: string;
}

export class LoginDto extends RegisterDto {}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}

export class UserInfoDto {
  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: '创建时间',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '最后登录时间',
    example: '2023-01-01T00:00:00Z',
  })
  lastLoginAt: Date;

  @ApiProperty({
    description: '最后登录IP',
    example: '192.168.1.1',
  })
  lastLoginIp: string;
}