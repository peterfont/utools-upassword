import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Password } from './entities/password.entity';

@Injectable()
export class PasswordsService {
  constructor(
    @InjectRepository(Password)
    private readonly passwordRepository: Repository<Password>,
  ) {}

  async findAll(
    page: number,
    size: number,
    username?: string,
    url?: string,
  ): Promise<[Password[], number]> {
    const where: any = {};
    if (username) {
      where.username = Like(`%${username}%`);
    }
    if (url) {
      where.url = Like(`%${url}%`);
    }

    return await this.passwordRepository.findAndCount({
      where,
      skip: page * size,
      take: size,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async create(createPasswordDto: Partial<Password>): Promise<Password> {
    const password = this.passwordRepository.create(createPasswordDto);
    return await this.passwordRepository.save(password);
  }

  async update(id: number, updatePasswordDto: Partial<Password>): Promise<Password> {
    await this.passwordRepository.update(id, updatePasswordDto);
    return await this.passwordRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.passwordRepository.delete(id);
  }
}