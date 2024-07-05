import { SoftDeletableEntity } from 'src/common/entity/soft-deletable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { BeforeInsert, Column, Entity } from 'typeorm';

@Entity('workspace')
export class Workspace extends SoftDeletableEntity {
  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  status: string;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'ws');
  }
}
