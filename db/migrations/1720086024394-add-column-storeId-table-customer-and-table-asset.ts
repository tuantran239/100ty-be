import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnStoreIdTableCustomerAndTableAsset1720086024394
  implements MigrationInterface
{
  name = 'AddColumnStoreIdTableCustomerAndTableAsset1720086024394';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableStoreId = new TableColumn({
      name: 'storeId',
      type: 'varchar',
      isNullable: true,
    });

    const tableForeignKeyStoreId = new TableForeignKey({
      columnNames: ['storeId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'store',
      onDelete: 'CASCADE',
    });

    await queryRunner.addColumn('customer', tableStoreId);

    await queryRunner.addColumn('asset', tableStoreId);

    await queryRunner.createForeignKey('customer', tableForeignKeyStoreId);

    await queryRunner.createForeignKey('asset', tableForeignKeyStoreId);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customer', 'storeId');
  }
}
