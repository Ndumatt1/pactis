import { IsNotEmpty, IsNumber, IsUUID, Min } from "class-validator";

export class DepositDto {
  @IsUUID()
  @IsNotEmpty()
  walletId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}
