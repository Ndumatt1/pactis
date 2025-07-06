import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseTable } from '../../../base/base.entity';
import { User } from '../../auth/entities/user.entity';

@Entity({ name: 'wallet' })
export class Wallet extends BaseTable {
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @OneToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance: string;

  @Column({ type: 'numeric', nullable: true, default: 0 })
  bonusBalance: number;
}
