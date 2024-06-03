import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnFinishContractDateTablePawn1717380161505
  implements MigrationInterface
{
  name = 'AddColumnFinishContractDateTablePawn1717380161505';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pawn',
      new TableColumn({
        name: 'finishDate',
        type: 'date',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pawn', 'finishDate');
  }
}
