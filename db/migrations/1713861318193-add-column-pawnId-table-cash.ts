import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnPawnIdTableCash1713861318193
  implements MigrationInterface
{
  name = 'AddColumnPawnIdTableCash1713861318193';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cash',
      new TableColumn({
        name: 'pawnId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'cash',
      new TableForeignKey({
        columnNames: ['pawnId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pawn',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'pawnId');
  }
}
