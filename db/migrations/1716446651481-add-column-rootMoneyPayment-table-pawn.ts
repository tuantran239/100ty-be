import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnRootMoneyPaymentTablePawn1716446651481
  implements MigrationInterface
{
  name = 'AddColumnRootMoneyPaymentTablePawn1716446651481';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pawn',
      new TableColumn({
        name: 'rootMoneyPayment',
        type: 'bigint',
        isNullable: false,
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pawn', 'rootMoneyPayment');
  }
}
