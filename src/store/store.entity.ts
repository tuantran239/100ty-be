import { BaseWorkspaceEntity } from 'src/common/entity/base-workspace.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('store')
export class Store extends BaseWorkspaceEntity {
  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  address: string;

  @Column()
  phoneNumber: string;

  @Column()
  status: string;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'store');
  }
}
