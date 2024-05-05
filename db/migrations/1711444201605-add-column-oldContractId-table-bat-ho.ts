import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnOldContractIdTableBatHo1711444201605
  implements MigrationInterface
{
  name = 'AddColumnOldContractIdTableBatHo1711444201605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bat_ho',
      new TableColumn({
        name: 'oldContractId',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );

    await queryRunner.createForeignKeys('bat_ho', [
      new TableForeignKey({
        columnNames: ['oldContractId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bat_ho',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bat_ho', 'oldContractId');
  }
}
