import { BaseWorkspaceEntity } from 'src/common/entity/base-workspace.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { BeforeInsert, Column, Entity } from 'typeorm';

@Entity('warehouse')
export class Warehouse extends BaseWorkspaceEntity {
  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  status: string;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'wh');
  }
}
