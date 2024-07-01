import { SoftDeletableEntity } from 'src/common/database/soft-deletable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('store')
export class Store extends SoftDeletableEntity {
  @Column()
  name: string;

  @Column()
  status: string;

  @Column()
  type: string;

  @Column()
  parentId?: string;

  @OneToOne(() => Store)
  @JoinColumn()
  mainStore?: Store;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'store');
  }
}
