import { IsNotEmpty, IsUUID } from "class-validator";

export class TransactionHistoryDto {
  @IsUUID()
  @IsNotEmpty()
  walletId: string
}