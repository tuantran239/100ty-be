import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnPaymentTypeTablePawn1716372261742
  implements MigrationInterface
{
  name = 'AddColumnPaymentTypeTablePawn1716372261742';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pawn',
      new TableColumn({
        name: 'paymentType',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pawn', 'paymentType');
  }
}
