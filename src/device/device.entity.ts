import { BaseWorkspaceEntity } from 'src/common/entity/base-workspace.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { BeforeInsert, Column, Entity } from 'typeorm';

@Entity('device')
export class Device extends BaseWorkspaceEntity {
  @Column()
  name: string;

  @Column({ type: 'character varying' })
  rangePrice: number[];

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'dev');
  }
}
