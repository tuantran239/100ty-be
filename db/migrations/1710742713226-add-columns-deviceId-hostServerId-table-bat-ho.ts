import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnsDeviceIdHostServerIdTableBatHo1710742713226
  implements MigrationInterface
{
  name = 'AddColumnsDeviceIdHostServerIdTableBatHo1710742713226';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('bat_ho', [
      new TableColumn({
        name: 'deviceId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'hostServerId',
        type: 'varchar',
        isNullable: true,
      }),
    ]);

    await queryRunner.createForeignKeys('bat_ho', [
      new TableForeignKey({
        columnNames: ['deviceId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'device',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['hostServerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'host_server',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('bat_ho', ['deviceId', 'hostServerId']);
  }
}
