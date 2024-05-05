import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsFirstNameLastNameTableUser1709887007104
  implements MigrationInterface
{
  name = 'AddColumnsFirstNameLastNameTableUser1709887007104';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('user', [
      new TableColumn({
        name: 'firstName',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'lastName',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('user', ['firstName', 'lastName']);
  }
}
