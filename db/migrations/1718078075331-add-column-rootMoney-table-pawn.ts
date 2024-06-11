import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnRootMoneyTablePawn1718078075331
  implements MigrationInterface
{
  name = 'AddColumnRootMoneyTablePawn1718078075331';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pawn',
      new TableColumn({
        name: 'rootMoney',
        type: 'integer',
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pawn', 'rootMoney');
  }
}
