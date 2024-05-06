import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTableAssetProperty1714967601845
  implements MigrationInterface
{
  name = 'CreateTableAssetProperty1714967601845';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'asset_property',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'propertyName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'assetTypeId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
            default: null,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKeys('asset_property', [
      new TableForeignKey({
        columnNames: ['assetTypeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'asset_type',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('asset_property');
  }
}
