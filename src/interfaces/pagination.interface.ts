import { PaginationDto } from "@/queries/page-options.queries";

export interface PageMetaDtoParameters {
  pageOptionsDto: PaginationDto;
  itemCount: number;
}
