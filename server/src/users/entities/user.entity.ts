import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: '用户ID' })
  id: number;

  @Column({ unique: true })
  @ApiProperty({ description: '用户名' })
  username: string;

  @Column()
  @Exclude()
  @ApiProperty({ description: '密码' })
  password: string;

  @CreateDateColumn()
  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @Column({ default: true })
  @ApiProperty({ description: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true })
  @ApiProperty({ description: '最后登录时间' })
  lastLoginAt: Date;

  @Column({ nullable: true })
  @ApiProperty({ description: '最后登录IP' })
  lastLoginIp: string;
}