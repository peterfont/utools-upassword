import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Password } from './entities/password.entity';
import { PasswordsService } from './passwords.service';

@ApiTags('passwords')
@Controller('data')
export class PasswordsController {
  constructor(private readonly passwordsService: PasswordsService) {}

  @Get()
  @ApiOperation({ summary: '获取密码列表' })
  @ApiResponse({ status: 200, description: '成功获取密码列表' })
  async findAll(@Query() query: { page?: number; size?: number; username?: string; url?: string }) {
    const { page = 0, size = 10, username, url } = query;
    const [items, total] = await this.passwordsService.findAll(page, size, username, url);
    
    return {
      code: '200',
      msg: '获取成功',
      success: true,
      fail: false,
      data: {
        content: items,
        totalElements: total,
        totalPages: Math.ceil(total / size),
        size: size,
        number: page,
        numberOfElements: items.length,
        first: page === 0,
        last: (page + 1) * size >= total,
        empty: items.length === 0
      }
    };
  }

  @Post()
  @ApiOperation({ summary: '创建密码记录' })
  @ApiResponse({ status: 201, description: '成功创建密码记录' })
  async create(@Body() createPasswordDto: Partial<Password>) {
    const result = await this.passwordsService.create(createPasswordDto);
    return {
      code: '200',
      msg: '创建成功',
      success: true,
      fail: false,
      data: result
    };
  }

  @Put()
  @ApiOperation({ summary: '更新密码记录' })
  @ApiResponse({ status: 200, description: '成功更新密码记录' })
  async update(@Body() updatePasswordDto: Partial<Password>) {
    const result = await this.passwordsService.update(updatePasswordDto.id, updatePasswordDto);
    return {
      code: '200',
      msg: '更新成功',
      success: true,
      fail: false,
      data: result
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除密码记录' })
  @ApiResponse({ status: 200, description: '成功删除密码记录' })
  async remove(@Param('id') id: number) {
    await this.passwordsService.remove(id);
    return {
      code: '200',
      msg: '删除成功',
      success: true,
      fail: false,
      data: 'success'
    };
  }
}