import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateColumnTableCustomer1709604255422
  implements MigrationInterface
{
  name = 'UpdateColumnTableCustomer1709604255422';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS full_name`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS phone_number`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS identity_card_no`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS identity_card_date`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS identity_card_place`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS metadata`,
    );
    await queryRunner.addColumns('customer', [
      new TableColumn({
        name: 'firstName',
        type: 'varchar',
        isNullable: false,
      }),
      new TableColumn({
        name: 'lastName',
        type: 'varchar',
        isNullable: false,
      }),
      new TableColumn({
        name: 'images',
        type: 'varchar[]',
        isNullable: true,
      }),
      new TableColumn({
        name: 'personalID',
        type: 'varchar',
        isNullable: false,
      }),
      new TableColumn({
        name: 'phoneNumber',
        type: 'varchar',
        isNullable: false,
      }),
      new TableColumn({
        name: 'releaseDate',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'publishedPlace',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'dateOfBirth',
        type: 'date',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'customerInfo',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS firstName`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS lastName`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS images`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS personalID`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS phoneNumber`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS releaseDate`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS publishedPlace`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS dateOfBirth`,
    );
    await queryRunner.query(
      `ALTER TABLE public.customer DROP COLUMN IF EXISTS customerInfo`,
    );
  }
}
