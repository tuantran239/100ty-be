import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsIsDebtDebtMoneyEbtMoneyTableCustomer1711589699535
  implements MigrationInterface
{
  name = 'AddColumnsIsDebtDebtMoneyEbtMoneyTableCustomer1711589699535';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('customer', [
      new TableColumn({
        name: 'isDebt',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'debtMoney',
        type: 'bigint',
        default: 0,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('customer', ['debtMoney', 'isDebt']);
  }
}
