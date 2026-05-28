// src/database/migrations/1748000001000-InitialSchema.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1748000001000 implements MigrationInterface {
  name = "InitialSchema1748000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum"
        AS ENUM('admin', 'doctor', 'patient')
    `);

    // Tabla users del user-service — perfil completo
    // Sin passwordHash ni refreshTokenHash — esos son del auth-service
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"          UUID          NOT NULL,
        "email"       VARCHAR(255)  NOT NULL,
        "first_name"  VARCHAR(100),
        "last_name"   VARCHAR(100),
        "phone"       VARCHAR(20),
        "role"        "public"."users_role_enum" NOT NULL DEFAULT 'patient',
        "is_active"   BOOLEAN       NOT NULL DEFAULT true,
        "created_at"  TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id"    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_email"     ON "users" ("email")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_users_is_active" ON "users" ("is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
