import { SoftDeletableEntity } from 'src/common/entity/soft-deletable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import {
  BeforeInsert,
  Column,
  Entity
} from 'typeorm';

@Entity('role')
export class Role extends SoftDeletableEntity {
  @Column()
  name: string;

  @Column()
  description?: string;

  @Column()
  level: number;

  @Column({ type: 'jsonb', nullable: true })
  permissions?: any;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'role');
  }
}
