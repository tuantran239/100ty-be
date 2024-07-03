import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsCodeAddressPhoneNumberTableStore1719965930574
  implements MigrationInterface
{
  name = 'AddColumnsCodeAddressPhoneNumberTableStore1719965930574';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('store', [
      new TableColumn({ name: 'code', type: 'varchar', isNullable: false }),
      new TableColumn({ name: 'address', type: 'varchar', isNullable: false }),
      new TableColumn({
        name: 'phoneNumber',
        type: 'varchar',
        isNullable: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('store', ['code', 'address', 'phoneNumber']);
  }
}
