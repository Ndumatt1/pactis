import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { envVarsSchema } from './helpers/env.validators';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { WorkerModule } from './workers/worker.module';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET } from './base/constant';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envVarsSchema,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{
        ttl: 60,
        limit: 10
      }]
    }),
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
        }),
      }),
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || 6379,
        // username, password if needed
      },
    }),
    {
      ...JwtModule.register({
        secret: JWT_SECRET,
        signOptions: {},
      }),
      global: true,
    },
    DatabaseModule,
    WalletModule,
    AuthModule,
    WorkerModule,
    WalletModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
