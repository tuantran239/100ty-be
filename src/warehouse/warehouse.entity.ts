import { SoftDeletableEntity } from 'src/common/database/soft-deletable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { BeforeInsert, Column, Entity } from 'typeorm';

@Entity('warehouse')
export class Warehouse extends SoftDeletableEntity {
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
