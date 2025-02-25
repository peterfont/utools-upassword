import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordsController } from './passwords.controller';
import { PasswordsService } from './passwords.service';
import { Password } from './entities/password.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Password])],
  controllers: [PasswordsController],
  providers: [PasswordsService],
  exports: [PasswordsService],
})
export class PasswordsModule {}