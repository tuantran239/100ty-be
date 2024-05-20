import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsSettlementDateSettlementDateTablePawn1716191437188
  implements MigrationInterface
{
  name = 'AddColumnsSettlementDateSettlementDateTablePawn1716191437188';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('pawn', [
      new TableColumn({
        name: 'settlementDate',
        type: 'date',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'startPaymentDate',
        type: 'date',
        isNullable: true,
        default: null,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('pawn', [
      'settlementDate',
      'startPaymentDate',
    ]);
  }
}
