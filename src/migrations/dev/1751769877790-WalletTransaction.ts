import { MigrationInterface, QueryRunner } from "typeorm";

export class WalletTransaction1751769877790 implements MigrationInterface {
    name = 'WalletTransaction1751769877790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wallet_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "sourceWalletId" uuid NOT NULL, "destinationWalletId" uuid NOT NULL, "amount" numeric(18,2) NOT NULL, "type" character varying NOT NULL, "description" character varying NOT NULL, "balanceBefore" numeric(18,2) NOT NULL, "balanceAfter" numeric(18,2) NOT NULL, "reference" character varying NOT NULL, "paymentStatus" character varying DEFAULT 'pending', CONSTRAINT "UQ_cf5f81913ef25820a315d939ecb" UNIQUE ("reference"), CONSTRAINT "PK_62a01b9c3a734b96a08c621b371" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cf5f81913ef25820a315d939ec" ON "wallet_transaction" ("reference") `);
        await queryRunner.query(`CREATE INDEX "IDX_5c055d61b75f4ec8add113ddb0" ON "wallet_transaction" ("paymentStatus") `);
        await queryRunner.query(`ALTER TABLE "wallet_transaction" ADD CONSTRAINT "FK_bc218688f35c148050bbaa9c07f" FOREIGN KEY ("sourceWalletId") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transaction" ADD CONSTRAINT "FK_f17aa8ac97871e5ea17f10b12af" FOREIGN KEY ("destinationWalletId") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet_transaction" DROP CONSTRAINT "FK_f17aa8ac97871e5ea17f10b12af"`);
        await queryRunner.query(`ALTER TABLE "wallet_transaction" DROP CONSTRAINT "FK_bc218688f35c148050bbaa9c07f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5c055d61b75f4ec8add113ddb0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cf5f81913ef25820a315d939ec"`);
        await queryRunner.query(`DROP TABLE "wallet_transaction"`);
    }

}
