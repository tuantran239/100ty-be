import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnsUserIdCustomerIdAssetTypeIdTablePawn1713860464916
  implements MigrationInterface
{
  name = 'AddColumnsUserIdCustomerIdAssetTypeIdTablePawn1713860464916';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('pawn', [
      new TableColumn({
        name: 'customerId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'userId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'assetTypeId',
        type: 'varchar',
        isNullable: true,
      }),
    ]);

    await queryRunner.createForeignKeys('pawn', [
      new TableForeignKey({
        columnNames: ['customerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customer',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['assetTypeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'asset_type',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('pawn', [
      'customerId',
      'userId',
      'assetTypeId',
    ]);
  }
}
