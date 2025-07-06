import { Column, Entity, Index, OneToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseTable } from '@/base/base.entity';
import { Role } from '@/enums/role.enum';

@Entity({ name: 'user' })
export class User extends BaseTable {
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  email: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Exclude()
  @Column({ type: 'text', nullable: false })
  password: string;

  @Index()
  @Column({
    type: 'varchar',
    default: Role.USER,
  })
  role: string;
}
