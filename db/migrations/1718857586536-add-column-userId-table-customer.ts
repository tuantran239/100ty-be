import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnUserIdTableCustomer1718857586536
  implements MigrationInterface
{
  name = 'AddColumnUserIdTableCustomer1718857586536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'customer',
      new TableColumn({
        name: 'userId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKeys('customer', [
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customer', 'userId');
  }
}
