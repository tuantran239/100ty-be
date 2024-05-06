import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnRevenueReceivedTablePawn1714982215957
  implements MigrationInterface
{
  name = 'AddColumnRevenueReceivedTablePawn1714982215957';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pawn',
      new TableColumn({
        name: 'revenueReceived',
        type: 'bigint',
        isNullable: false,
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pawn', 'revenueReceived');
  }
}
