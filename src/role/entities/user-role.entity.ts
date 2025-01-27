import { SoftDeletableEntity } from 'src/common/database/soft-deletable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Role } from './role.entity';

@Entity('user_role')
export class UserRole extends SoftDeletableEntity {
  @Column()
  user_id: string;

  @Column()
  role_id: string;

  @OneToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'user_role');
  }
}
