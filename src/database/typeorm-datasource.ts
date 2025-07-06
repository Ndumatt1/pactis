import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { DATABASE_URL } from './config';


export const options: DataSourceOptions = {
  type: 'postgres',
  url: DATABASE_URL,
  entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [
      path.join(__dirname, '/../**/migrations/dev/*{.ts,.js}'),
  ],
  synchronize: false,
};

export default new DataSource(options);
