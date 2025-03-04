import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('passwords')
export class Password {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  url: string;

  @CreateDateColumn()
  timestamp: Date;
}