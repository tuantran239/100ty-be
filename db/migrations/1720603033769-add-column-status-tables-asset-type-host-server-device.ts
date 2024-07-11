import { StatusActiveColumn } from 'db/base/status-active-column';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnStatusTablesAssetTypeHostServerDevice1720603033769
  implements MigrationInterface
{
  name = 'AddColumnStatusTablesAssetTypeHostServerDevice1720603033769';

  public async up(queryRunner: QueryRunner): Promise<void> {

    const StatusTables = ['asset_type', 'host_server', 'device']

    await Promise.all(StatusTables.map(async (table) => {
      await queryRunner.addColumn(table, StatusActiveColumn)
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const StatusTables = ['asset_type', 'host_server', 'device']

    await Promise.all(StatusTables.map(async (table) => {
      await queryRunner.dropColumn(table, 'status');
    }))
  }
}
