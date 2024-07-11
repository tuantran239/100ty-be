import { SoftDeleteColumn } from 'db/base/soft-delete-column';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTableServiceFeeContract1720604782157
  implements MigrationInterface
{
  name = 'CreateTableServiceFeeContract1720604782157';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'service_fee_contract',
        columns: [
          ...SoftDeleteColumn,
          {
            name: 'amountType',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'serviceFeeId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'contractType',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'contractId',
            type: 'varchar',
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'service_fee_contract',
      new TableForeignKey({
        columnNames: ['serviceFeeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'service_fee',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('service_fee_contract');
  }
}
