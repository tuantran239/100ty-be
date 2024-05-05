import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteTableGroupCashType1713331228678
  implements MigrationInterface
{
  name = 'DeleteTableGroupCashType1713331228678';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'cashTypeId');

    await queryRunner.query(`DROP TABLE group_cash_type`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(``);
  }
}
