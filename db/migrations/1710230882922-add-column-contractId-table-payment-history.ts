import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnContractIdTablePaymentHistory1710230882922
  implements MigrationInterface
{
  name = 'AddColumnContractIdTablePaymentHistory1710230882922';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('payment_history', [
      new TableColumn({
        name: 'contractId',
        type: 'varchar',
        isNullable: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payment_history', 'contractId');
  }
}
