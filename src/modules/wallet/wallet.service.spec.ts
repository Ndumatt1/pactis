import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet_transaction.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Queue } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/tranfer.dto';

const mockWalletRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});
const mockTransactionRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
});
const mockCache = { get: jest.fn(), set: jest.fn() };
const mockQueue = { add: jest.fn() };
const mockDataSource = {
  transaction: jest.fn(fn => fn({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findAndCount: jest.fn(),
  })),
};

describe('WalletService', () => {
  let service: WalletService;
  let walletRepo: Repository<Wallet>;
  let transactionRepo: Repository<WalletTransaction>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(Wallet), useFactory: mockWalletRepo },
        { provide: getRepositoryToken(WalletTransaction), useFactory: mockTransactionRepo },
        { provide: CACHE_MANAGER, useValue: mockCache },
        { provide: 'BullQueue_transaction-queue', useValue: mockQueue },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    walletRepo = module.get(getRepositoryToken(Wallet));
    transactionRepo = module.get(getRepositoryToken(WalletTransaction));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a wallet if not exists', async () => {
    walletRepo.findOne = jest.fn().mockResolvedValue(null);
    walletRepo.create = jest.fn().mockReturnValue({ userId: 'user1' });
    walletRepo.save = jest.fn().mockResolvedValue({ id: 'wallet1', userId: 'user1', balance: '0' });
    const wallet = await service.createWallet('user1');
    expect(wallet).toEqual({ id: 'wallet1', userId: 'user1', balance: '0' });
  });

  it('should throw if wallet already exists', async () => {
    walletRepo.findOne = jest.fn().mockResolvedValue({ id: 'wallet1', userId: 'user1' });
    await expect(service.createWallet('user1')).rejects.toBeDefined();
  });

  it('should deposit funds', async () => {
    const depositDto: DepositDto = { walletId: 'wallet1', amount: 100 };
    mockDataSource.transaction = jest.fn(fn => fn({
      findOne: jest.fn().mockResolvedValue({ id: 'wallet1', userId: 'user1', balance: '0' }),
      save: jest.fn(),
      create: jest.fn().mockReturnValue({}),
    }));
    const result = await service.depositFunds(depositDto, 'user1');
    expect(result).toBeDefined();
  });

  it('should queue a withdrawal request', async () => {
    walletRepo.findOne = jest.fn().mockResolvedValue({ id: 'wallet1', userId: 'user1', balance: '100' });
    mockQueue.add = jest.fn().mockResolvedValue({ id: 'job1' });
    const dto: WithdrawDto = { walletId: 'wallet1', amount: 50 };
    const job = await service.requestWithdrawal(dto, 'user1');
    expect(job).toEqual({ id: 'job1' });
  });

  it('should queue a transfer request', async () => {
    walletRepo.findOne = jest.fn()
      .mockResolvedValueOnce({ id: 'wallet1', userId: 'user1', balance: '100' })
      .mockResolvedValueOnce({ id: 'wallet2', userId: 'user2', balance: '0' });
    mockQueue.add = jest.fn().mockResolvedValue({ id: 'job2' });
    const dto: TransferDto = { sourceWalletId: 'wallet1', destinationWalletId: 'wallet2', amount: 10, reference: 'ref1' };
    const job = await service.requestTransfer(dto, 'user1');
    expect(job).toEqual({ id: 'job2' });
  });
});
