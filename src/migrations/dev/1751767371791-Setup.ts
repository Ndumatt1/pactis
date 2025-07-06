import { MigrationInterface, QueryRunner } from "typeorm";

export class Setup1751767371791 implements MigrationInterface {
    name = 'Setup1751767371791'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "phoneNumber" character varying(20), "firstName" character varying(50) NOT NULL, "lastName" character varying(50) NOT NULL, "email" character varying(50) NOT NULL, "emailVerified" boolean NOT NULL DEFAULT false, "password" text NOT NULL, "role" character varying NOT NULL DEFAULT 'USER', CONSTRAINT "UQ_f2578043e491921209f5dadd080" UNIQUE ("phoneNumber"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6620cd026ee2b231beac7cfe57" ON "user" ("role") `);
        await queryRunner.query(`CREATE TABLE "wallet" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid NOT NULL, "balance" numeric(18,2) NOT NULL DEFAULT '0', "bonusBalance" numeric NOT NULL, CONSTRAINT "REL_35472b1fe48b6330cd34970956" UNIQUE ("userId"), CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "sourceWalletId" uuid NOT NULL, "destinationWalletId" uuid NOT NULL, "amount" numeric(18,2) NOT NULL, "type" character varying NOT NULL, "description" character varying NOT NULL, "balanceBefore" numeric(18,2) NOT NULL, "balanceAfter" numeric(18,2) NOT NULL, "reference" character varying NOT NULL, "paymentStatus" character varying DEFAULT 'pending', CONSTRAINT "UQ_0b12a144bdc7678b6ddb0b913fc" UNIQUE ("reference"), CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0b12a144bdc7678b6ddb0b913f" ON "transaction" ("reference") `);
        await queryRunner.query(`CREATE INDEX "IDX_69a3816ea4c97ecfff4a9b5b56" ON "transaction" ("paymentStatus") `);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "FK_35472b1fe48b6330cd349709564" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_4dbaac33d5403f462da6cdeaac6" FOREIGN KEY ("sourceWalletId") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_f18fc08c86f38e846624e3526e9" FOREIGN KEY ("destinationWalletId") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_f18fc08c86f38e846624e3526e9"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_4dbaac33d5403f462da6cdeaac6"`);
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "FK_35472b1fe48b6330cd349709564"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_69a3816ea4c97ecfff4a9b5b56"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b12a144bdc7678b6ddb0b913f"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TABLE "wallet"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6620cd026ee2b231beac7cfe57"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
