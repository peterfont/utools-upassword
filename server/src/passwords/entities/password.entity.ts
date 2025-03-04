import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('passwords')
export class Password {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: '密码记录ID' })
  id: number;

  @Column()
  @ApiProperty({ description: '用户名' })
  username: string;

  @Column()
  @ApiProperty({ description: '加密后的密码' })
  password: string;

  @Column()
  @ApiProperty({ description: '网站URL' })
  url: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '备注', required: false })
  note: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  @ApiProperty({ description: '所属用户' })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @Column({ default: false })
  @ApiProperty({ description: '是否已删除' })
  isDeleted: boolean;
}