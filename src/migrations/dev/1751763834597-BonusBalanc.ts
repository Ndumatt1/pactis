import { MigrationInterface, QueryRunner } from "typeorm";

export class BonusBalanc1751763834597 implements MigrationInterface {
    name = 'BonusBalanc1751763834597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet" ALTER COLUMN "bonusBalance" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wallet" ALTER COLUMN "bonusBalance" SET DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet" ALTER COLUMN "bonusBalance" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wallet" ALTER COLUMN "bonusBalance" SET NOT NULL`);
    }

}
