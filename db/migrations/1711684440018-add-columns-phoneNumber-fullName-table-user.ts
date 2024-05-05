import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsPhoneNumberFullNameTableUser1711684440018
  implements MigrationInterface
{
  name = 'AddColumnsPhoneNumberFullNameTableUser1711684440018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('user', [
      new TableColumn({
        name: 'phoneNumber',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fullName',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('user', ['phoneNumber', 'fullName']);
  }
}
