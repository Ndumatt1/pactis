import { IsNumber, IsUUID, Min } from "class-validator";

export class WithdrawDto {
  @IsUUID()
  walletId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}
