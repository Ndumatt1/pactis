import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import dataSource, { options } from './typeorm-datasource';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => options,
      dataSourceFactory: async () => {
        return dataSource.initialize();
      },
    }),
  ],
})
export class DatabaseModule { }
