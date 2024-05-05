import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsPermissionsLevelTableRole1711349381804
  implements MigrationInterface
{
  name = 'AddColumnsPermissionsLevelTableRole1711349381804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('role', [
      new TableColumn({
        name: 'permissions',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'level',
        type: 'integer',
        isNullable: false,
        default: 0,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('role', ['permissions', 'level']);
  }
}
