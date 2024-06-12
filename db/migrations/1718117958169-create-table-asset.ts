import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableAsset1718117958169 implements MigrationInterface {
  name = 'CreateTableAsset1718117958169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'asset',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'assetCode',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'assetName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'loanAmount',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
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
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('asset');
  }
}
