import { ConfigService } from "@nestjs/config";

const configService = new ConfigService();

export const TWENTY_FOUR_HOURS = 60 * 60 * 24;
export const TWO_HOURS = 7200
export const TX_HISTORY_CACHE_PREFIX = (walletId: string) => `tx-history:${walletId}`;
export const TRANSACTION_QUEUE = 'transaction-queue';
export const JWT_SECRET = configService.get('JWT_SECRET');
