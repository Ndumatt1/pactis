import { TransactionStatus } from '@/enums/transaction-status.enum';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}
export class PaginationDto {
  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.DESC;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @IsOptional()
  @IsDateString()
  readonly from?: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  readonly status?: TransactionStatus;


  @IsOptional()
  @IsDateString()
  readonly to?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly limit?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
