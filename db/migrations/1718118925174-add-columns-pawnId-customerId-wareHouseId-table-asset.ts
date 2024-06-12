import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnsPawnIdCustomerIdWareHouseIdTableAsset1718118925174
  implements MigrationInterface
{
  name = 'AddColumnsPawnIdCustomerIdWareHouseIdTableAsset1718118925174';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('asset', [
      new TableColumn({
        name: 'pawnId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'customerId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'warehouseId',
        type: 'varchar',
        isNullable: true,
      }),
    ]);

    await queryRunner.createForeignKeys('asset', [
      new TableForeignKey({
        columnNames: ['customerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customer',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['pawnId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pawn',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['warehouseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'warehouse',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('asset', [
      'pawnId',
      'customerId',
      'warehouseId',
    ]);
  }
}
