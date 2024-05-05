import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropColumnsTableUser1711686672499 implements MigrationInterface {
  name = 'DropColumnsTableUser1711686672499';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.user DROP COLUMN IF EXISTS "firstName"`,
    );
    await queryRunner.query(
      `ALTER TABLE public.user DROP COLUMN IF EXISTS "lastName"`,
    );
    await queryRunner.query(
      `ALTER TABLE public.user DROP COLUMN IF EXISTS "email"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('');
  }
}
