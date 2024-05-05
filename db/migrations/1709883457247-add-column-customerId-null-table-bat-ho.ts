import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnCustomerIdNullTableBatHo1709883457247
  implements MigrationInterface
{
  name = 'AddColumnCustomerIdNullTableBatHo1709883457247';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bat_ho',
      new TableColumn({
        name: 'customerId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKeys('bat_ho', [
      new TableForeignKey({
        columnNames: ['customerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customer',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bat_ho', 'customerId');
  }
}
