import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, In, Repository, Transaction } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet_transaction.entity';
import { ErrorHelper } from '@/utils/error.util';
import { DepositDto } from './dto/deposit.dto';
import { TransactionType } from '@/enums/transaction-type.enum';
import { v4 as uuidv4 } from 'uuid';
import { TransactionStatus } from '@/enums/transaction-status.enum';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/tranfer.dto';
import { PaginationResultDto } from '@/queries/pagination.queries';
import { PaginationMetadataDto } from '@/queries/page-meta.queries';
import { PaginationDto } from '@/queries/page-options.queries';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { generateCacheKey, generateTxHistoryCacheKey, invalidateCache, invalidateCacheByPattern } from '@/utils/cache.util';
import { TRANSACTION_QUEUE, TWENTY_FOUR_HOURS, TWO_HOURS } from '@/base/constant';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { User } from '../auth/entities/user.entity';


@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name)
  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction) private transactionRepo: Repository<WalletTransaction>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue(TRANSACTION_QUEUE) private readonly txQueue: Queue,

    private dataSource: DataSource,
  ) { }

  /**
   * Creates a wallet for a user.
   *
   * @param {string} userId - The ID of the user creating the wallet.
   * @returns {Promise<Wallet>} The created wallet entity.
   * @throws {ConflictException} If the user already has a wallet.
   */
  async createWallet(userId: string): Promise<Wallet> {
    const existing = await this.walletRepo.findOne({ where: { userId } });
    if (existing) {
      ErrorHelper.ConflictException('You already have an existing wallet');
    }

    const wallet = this.walletRepo.create({ userId });
    return await this.walletRepo.save(wallet);
  }

  /**
   * Deposits funds into a wallet.
   *
   * @param {DepositDto} dto - Deposit data containing walletId and amount.
   * @param {string} userId - The ID of the user making the request
   * @returns {Promise<Transaction>} The deposit transaction record.
   * @throws {NotFoundException} If wallet does not exist.
   */
  async depositFunds(dto: DepositDto, userId: string): Promise<WalletTransaction> {
    return await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { id: dto.walletId, userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) ErrorHelper.NotFoundException('Wallet not found');

      const balanceBefore = +wallet.balance;
      const balanceAfter = balanceBefore + dto.amount;

      wallet.balance = balanceAfter.toString();
      await manager.save(wallet);

      const transaction = manager.create(WalletTransaction, {
        sourceWallet: wallet,
        destinationWallet: wallet,
        amount: dto.amount.toString(),
        type: TransactionType.CREDIT,
        description: `Wallet deposit ${dto.amount}`,
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        reference: uuidv4(),
        paymentStatus: TransactionStatus.SUCCESS,
      });

      await manager.save(transaction);

      await Promise.all([
        invalidateCacheByPattern(wallet.id),
        invalidateCache(userId, this.cacheManager)
      ])

      return transaction
    })
  }

  /**
   * Requests funds withdrawal from a wallet.
   *
   * @param {WithdrawDto} dto - Withdrawal data containing walletId and amount.
   * @param {string} userId - The ID of the user making the request
   * @returns {Promise<Transaction>} The withdrawal transaction record.
   * @throws {NotFoundException} If wallet does not exist.
   * @throws {BadRequestException} If balance is insufficient.
   */
  async requestWithdrawal(dto: WithdrawDto, userId: string): Promise<Job<WithdrawDto>> {
    const wallet = await this.walletRepo.findOne({
      where: { id: dto.walletId, userId }
    })

    if (!wallet) ErrorHelper.NotFoundException('Wallet not found');
    const balanceBefore = +wallet.balance;
    if (balanceBefore < dto.amount) {
      ErrorHelper.BadRequestException('Insufficient funds. Top up your wallet');
    }
    return this.txQueue.add('withdraw', dto)
  }

  /**
* Performs the actual withdrawal inside a transaction.
*
* @param {WithdrawDto} dto
* @returns {Promise<WalletTransaction>}
*/
  async withdrawFunds(dto: WithdrawDto): Promise<WalletTransaction> {
    return await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { id: dto.walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) ErrorHelper.NotFoundException('Wallet not found');

      const balanceBefore = +wallet.balance;
      if (balanceBefore < dto.amount) {
        ErrorHelper.BadRequestException('Insufficient funds. Top up your wallet');
      }

      const balanceAfter = balanceBefore - dto.amount;
      wallet.balance = balanceAfter.toString();
      await manager.save(wallet);

      const transaction = manager.create(WalletTransaction, {
        sourceWalletId: wallet.id,
        destinationWallet: wallet,
        amount: dto.amount.toString(),
        type: TransactionType.DEBIT,
        description: `Wallet withdrawal of ${dto.amount}`,
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        reference: uuidv4(),
        paymentStatus: TransactionStatus.SUCCESS,
      });

      await manager.save(transaction);
      await Promise.all([
        invalidateCacheByPattern(wallet.id),
        invalidateCache(wallet.userId, this.cacheManager)
      ])
      return transaction;
    });
  }

  /**
 * Queues a wallet transfer job after basic validation.
 *
 * @param {TransferDto} dto - Transfer data.
 * @param {string} userId - The ID of the user making the request
 * @returns {Promise<Job<TransferDto>>} Bull job for the transfer.
 * @throws {NotFoundException} If wallets not found.
 * @throws {BadRequestException} If balance is insufficient.
 */
  async requestTransfer(dto: TransferDto, userId: string): Promise<Job<TransferDto>> {
    const [source, destination] = await Promise.all([
      this.walletRepo.findOne({ where: { id: dto.sourceWalletId, userId } }),
      this.walletRepo.findOne({ where: { id: dto.destinationWalletId } })
    ]);

    if (!source) ErrorHelper.NotFoundException('Sender wallet not found');
    if (!destination) {
      this.logger.log(`Destination wallet not found`);
      ErrorHelper.NotFoundException('Receiver wallet not found');
    }
    if (+source.balance < dto.amount) {
      ErrorHelper.BadRequestException('Insufficient funds');
    }

    return this.txQueue.add('transfer', dto);
  }

  /**
 * Performs the transfer with concurrency safety and idempotency.
 *
 * @param {TransferDto} dto - Transfer details.
 * @returns {Promise<{ success: boolean }>} Transfer result.
 */
  async transferFunds(dto: TransferDto): Promise<{ success: boolean }> {
    return await this.dataSource.transaction(async (manager) => {
      const existing = await this.transactionRepo.findOne({ where: { reference: dto.reference } });
      if (existing) return { success: true };

      const source = await manager.findOne(Wallet, {
        where: { id: dto.sourceWalletId },
        lock: { mode: 'pessimistic_write' },
      });

      const dest = await manager.findOne(Wallet, {
        where: { id: dto.destinationWalletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!source || !dest) ErrorHelper.NotFoundException('One or both wallets not found');
      if (+source.balance < dto.amount) ErrorHelper.BadRequestException('Insufficient funds');

      const [sourceUser, destUser] = await Promise.all([
        manager.findOne<User>(User, {
          where: { id: source.userId },
          select: ['firstName', 'lastName'],
        }),
        manager.findOne<User>(User, {
          where: { id: dest.userId },
          select: ['firstName', 'lastName'],
        }),
      ]);



      const sourceBefore = +source.balance;
      const destBefore = +dest.balance;

      source.balance = (sourceBefore - dto.amount).toString();
      dest.balance = (destBefore + dto.amount).toString();

      await manager.save([source, dest]);

      const debit = manager.create(WalletTransaction, {
        sourceWallet: source,
        destinationWallet: dest,
        amount: dto.amount.toString(),
        type: TransactionType.DEBIT,
        description: `Transfer to ${destUser.firstName} ${destUser.lastName}`,
        balanceBefore: sourceBefore.toString(),
        balanceAfter: source.balance,
        reference: dto.reference,
        paymentStatus: TransactionStatus.SUCCESS,
      });

      const credit = manager.create(WalletTransaction, {
        sourceWallet: source,
        destinationWallet: dest,
        amount: dto.amount.toString(),
        type: TransactionType.CREDIT,
        description: `Transfer from ${sourceUser.firstName} ${sourceUser.lastName}`,
        balanceBefore: destBefore.toString(),
        balanceAfter: dest.balance,
        reference: `credit${dto.reference}`,
        paymentStatus: TransactionStatus.SUCCESS,
      });

      await manager.save([debit, credit]);

      await Promise.all([
        invalidateCacheByPattern(dto.sourceWalletId),
        invalidateCacheByPattern(dto.destinationWalletId),
        invalidateCache(source.userId, this.cacheManager),
        invalidateCache(dest.userId, this.cacheManager)
      ]);

      return { success: true };
    });
  }


  /**
 * Retrieves paginated wallet transaction history (deposits, withdrawals, transfers).
 *
 * @param {string} walletId - The ID of the wallet to retrieve transactions for.
 * @param {string} userId - The ID of the user making the request
 * @param {PaginationDto} pageOptionsDto - Pagination and filter options.
 * @returns {Promise<PaginationResultDto<WalletTransaction>>} Paginated list of transactions with metadata.
 *
 * @throws {BadRequestException} If invalid date range is provided.
 */
  async getTransactionHistory(
    walletId: string,
    pageOptionsDto: PaginationDto,
  ): Promise<PaginationResultDto<WalletTransaction>> {
    const cacheKey = generateTxHistoryCacheKey(walletId, pageOptionsDto);
    const cached = await this.cacheManager.get<PaginationResultDto<WalletTransaction>>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return cached;
    }
    const { status, from, to, limit, skip, order } = pageOptionsDto;

    const whereClause: any = {
      sourceWalletId: walletId,
    };

    if (status) {
      whereClause.paymentStatus = status;
    }

    if (to && !from) {
      ErrorHelper.BadRequestException('"from" date is required when "to" is provided');
    }

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (fromDate > toDate) {
        ErrorHelper.BadRequestException('"from" date cannot be greater than "to" date');
      }
      toDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = Between(fromDate, toDate);
    }

    const [transactions, itemCount] = await this.transactionRepo.findAndCount({
      where: whereClause,
      take: limit,
      skip,
      order: { createdAt: order || 'DESC' },
    });

    const meta = new PaginationMetadataDto({ itemCount, pageOptionsDto });
    const result = new PaginationResultDto(transactions, meta);
    await this.cacheManager.set(cacheKey, result, TWENTY_FOUR_HOURS);

    return result;
  }

  /**
   * Retrieves a wallet by userId.
   *
   * @param {string} userId - The ID of the user whose wallet is requested.
   * @returns {Promise<Wallet>} The wallet entity.
   * @throws {NotFoundException} If wallet is not found.
   */
  async getWallet(userId: string): Promise<Wallet> {
    const cacheKey = generateCacheKey(userId)

    const cachedWallet = await this.cacheManager.get<Wallet>(cacheKey);
    if (cachedWallet) {
      return cachedWallet;
    }

    const wallet = await this.walletRepo.findOne({ where: { userId } });

    if (!wallet) {
      ErrorHelper.NotFoundException('Wallet not found');
    }

    await this.cacheManager.set(cacheKey, wallet, TWO_HOURS);

    return wallet;
  }
}
