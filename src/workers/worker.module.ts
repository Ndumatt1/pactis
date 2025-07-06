// src/worker/worker.module.ts
import { Module, MiddlewareConsumer, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TRANSACTION_QUEUE } from '@/base/constant';
import { WalletModule } from '@/modules/wallet/wallet.module';
import { Wallet } from '@/modules/wallet/entities/wallet.entity';
import { WalletTransaction } from '@/modules/wallet/entities/wallet_transaction.entity';
import { TransactionProcessor } from './transaction.processor';


const queueOptions = {
  options: {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    },
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000 * 60, // 1 min
      },
    },
  },
};

@Module({
  imports: [
    BullModule.registerQueue({
      name: TRANSACTION_QUEUE,
      ...queueOptions,
    }),
    forwardRef(() => WalletModule),
    TypeOrmModule.forFeature([Wallet, WalletTransaction]),
  ],
  providers: [
    TransactionProcessor,
    // WalletService
  ],
})
export class WorkerModule { }
