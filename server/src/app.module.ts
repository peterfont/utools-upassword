import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PasswordsModule } from './passwords/passwords.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'panruipeng',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'upassword',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),
    PasswordsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}