import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

import { WalletService } from '@/modules/wallet/wallet.service';
import { WithdrawDto } from '@/modules/wallet/dto/withdraw.dto';
import { TransferDto } from '@/modules/wallet/dto/tranfer.dto';
import { TRANSACTION_QUEUE } from '@/base/constant';

@Processor(TRANSACTION_QUEUE)
export class TransactionProcessor extends WorkerHost {
  private readonly logger = new Logger(TransactionProcessor.name);

  constructor(
    private readonly walletService: WalletService,
    @InjectQueue(TRANSACTION_QUEUE)
    private readonly transactionQueue: Queue
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing transaction job: ${job.name}`);
    try {
      switch (job.name) {
        case 'withdraw':
          return await this.walletService.withdrawFunds(job.data as WithdrawDto);
        case 'transfer':
          return await this.walletService.transferFunds(job.data as TransferDto);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return;
      }
    } catch (err) {
      this.logger.error(
        `[${job.name}] Job failed: ID=${job.id}, Data=${JSON.stringify(job.data)}, Reason=${err.message}`
      );
      throw err;
    }
  }
}