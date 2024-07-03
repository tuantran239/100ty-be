import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnsReferenceStore1719906711325
  implements MigrationInterface
{
  name = 'AddColumnsReferenceStore1719906711325';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableStoreId = new TableColumn({
      name: 'storeId',
      type: 'varchar',
      isNullable: true,
    });

    await queryRunner.addColumn('user', tableStoreId);

    await queryRunner.addColumn('bat_ho', tableStoreId);

    await queryRunner.addColumn('pawn', tableStoreId);

    await queryRunner.addColumn('payment_history', tableStoreId);

    await queryRunner.addColumn('transaction_history', tableStoreId);

    await queryRunner.addColumn('cash', tableStoreId);

    const tableForeignKeyStoreId = new TableForeignKey({
      columnNames: ['storeId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'store',
      onDelete: 'CASCADE',
    });

    await queryRunner.createForeignKey('user', tableForeignKeyStoreId);

    await queryRunner.createForeignKey('bat_ho', tableForeignKeyStoreId);

    await queryRunner.createForeignKey('pawn', tableForeignKeyStoreId);

    await queryRunner.createForeignKey('payment_history', tableForeignKeyStoreId);

    await queryRunner.createForeignKey('transaction_history', tableForeignKeyStoreId);

    await queryRunner.createForeignKey('cash', tableForeignKeyStoreId);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'storeId');
    await queryRunner.dropColumn('bat_ho', 'storeId');
    await queryRunner.dropColumn('pawn', 'storeId');
    await queryRunner.dropColumn('payment_history', 'storeId');
    await queryRunner.dropColumn('transaction_history', 'storeId');
    await queryRunner.dropColumn('cash', 'storeId');
  }
}
