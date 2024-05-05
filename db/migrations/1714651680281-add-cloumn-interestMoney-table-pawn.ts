import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCloumnInterestMoneyTablePawn1714651680281
  implements MigrationInterface
{
  name = 'AddCloumnInterestMoneyTablePawn1714651680281';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pawn',
      new TableColumn({
        name: 'interestMoney',
        type: 'integer',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pawn', 'interestMoney');
  }
}
