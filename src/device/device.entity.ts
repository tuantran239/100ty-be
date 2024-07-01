import { SoftDeletableEntity } from 'src/common/database/soft-deletable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { BeforeInsert, Column, Entity } from 'typeorm';

@Entity('device')
export class Device extends SoftDeletableEntity {
  @Column()
  name: string;

  @Column({ type: 'character varying' })
  rangePrice: number[];

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'dev');
  }
}
