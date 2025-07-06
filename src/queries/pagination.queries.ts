import { IsArray } from 'class-validator';
import { PaginationMetadataDto } from './page-meta.queries';

export class PaginationResultDto<T> {
  @IsArray()
  readonly data: T[];

  readonly meta: PaginationMetadataDto;

  constructor(data: T[], meta: PaginationMetadataDto) {
    this.data = data;
    this.meta = meta;
  }
}
