import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet_transaction.entity';
import { WorkerModule } from '@/workers/worker.module';
import { TRANSACTION_QUEUE } from '@/base/constant';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction]),
    forwardRef(() => WorkerModule),
    BullModule.registerQueue({
      name: TRANSACTION_QUEUE, // <-- use 'name', not 'queueName'
    }),
    JwtModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService]
})
export class WalletModule { }