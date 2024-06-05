import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnContractTypeTableTransactionHistory1717571320801
  implements MigrationInterface
{
  name = 'AddColumnContractTypeTableTransactionHistory1717571320801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transaction_history',
      new TableColumn({
        name: 'contractType',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transaction_history', 'contractType');
  }
}
