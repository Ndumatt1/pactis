import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/tranfer.dto';
import { PaginationDto } from '@/queries/page-options.queries';
import { AuthGuard } from '@/guards/auth.guard';
import { User } from '@/decorators/user.decorator';
import { IUsers } from '@/interfaces/user.interface';
import { HttpResponse } from '@/utils/http-response.utils';
import { TransactionHistoryDto } from './dto/transaction-history.dto';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Post('create')
  async createWallet(@User() user: IUsers) {
    const data = await this.walletService.createWallet(user.id);

    return HttpResponse.success({ data, message: 'Wallet created successfully' });
  }

  @Post('deposit')
  async depositFunds(@Body() dto: DepositDto, @User() user: IUsers) {
    const data = await this.walletService.depositFunds(dto, user.id);

    return HttpResponse.success({ data, message: 'Deposit successful' });
  }

  @Post('withdraw')
  async requestWithdrawal(@Body() dto: WithdrawDto, @User() user: IUsers) {
    const data = await this.walletService.requestWithdrawal(dto, user.id);

    return HttpResponse.success({ data, message: 'Withdrawal is being processed' });
  }

  @Get('/')
  async checkBalance(@User() user: IUsers) {
    const data = await this.walletService.getWallet(user.id);

    return HttpResponse.success({ data, message: 'Wallet Fetched successfully' });
  }

  @Post('transfer')
  async requestTransfer(@Body() dto: TransferDto, @User() user: IUsers) {
    const data = await this.walletService.requestTransfer(dto, user.id);

    return HttpResponse.success({ data, message: 'Transfer successful' });
  }

  @Get('transactions/:walletId')
  @HttpCode(HttpStatus.OK)
  async getTransactionHistory(
    @User() user: IUsers,
    @Param('walletId', new ParseUUIDPipe()) walletId: string,
    @Query() pageOptions: PaginationDto,
  ) {
    const data = await this.walletService.getTransactionHistory(walletId, pageOptions);

    return HttpResponse.success({ data, message: 'Transaction history fetched successfully' });
  }

}
