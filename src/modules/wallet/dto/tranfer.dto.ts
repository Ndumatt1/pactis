import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from "class-validator";

export class TransferDto {
  @IsUUID()
  @IsNotEmpty()
  sourceWalletId: string;

  @IsUUID()
  @IsNotEmpty()
  destinationWalletId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reference: string;
}
