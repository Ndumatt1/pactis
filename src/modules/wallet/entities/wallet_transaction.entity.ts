import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Wallet } from './wallet.entity';
import { TransactionType } from '@/enums/transaction-type.enum';
import { TransactionStatus } from '@/enums/transaction-status.enum';
import { BaseTable } from '@/base/base.entity';


@Entity({ name: 'wallet_transaction' })
export class WalletTransaction extends BaseTable {
  @Column({ type: 'uuid', nullable: false })
  sourceWalletId: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceWalletId' })
  sourceWallet: Wallet;

  @Column({ type: 'uuid', nullable: false })
  destinationWalletId: string;

  @ManyToOne(() => Wallet, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destinationWalletId' })
  destinationWallet: Wallet;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', nullable: false })
  type: TransactionType;

  @Column({ type: 'varchar', nullable: false })
  description: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  balanceBefore: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  balanceAfter: string;

  @Index()
  @Column({ type: 'varchar', nullable: false, unique: true })
  reference: string;

  @Index()
  @Column({ type: 'varchar', nullable: true, default: TransactionStatus.PENDING })
  paymentStatus: TransactionStatus;
}
