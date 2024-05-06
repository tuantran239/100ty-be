import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCloumnsServiceFeeAssetNameTablePawn1714967613925
  implements MigrationInterface
{
  name = 'AddCloumnsServiceFeeAssetNameTablePawn1714967613925';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('pawn', [
      new TableColumn({
        name: 'serviceFee',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'assetName',
        type: 'varchar',
        isNullable: false,
        default: `'Tên tài sản'`,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('pawn', ['serviceFee', 'assetName']);
  }
}
