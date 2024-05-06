import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCloumnFilesTablePawn1714969229776
  implements MigrationInterface
{
  name = 'AddCloumnFilesTablePawn1714969229776';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pawn',
      new TableColumn({
        name: 'files',
        type: 'varchar[]',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pawn', 'files');
  }
}
