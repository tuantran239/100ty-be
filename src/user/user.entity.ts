import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { SoftDeletableEntity } from '../common/database/solf-deletetable.entity';
import { generateEntityId } from '../common/utils/generated-id';
import { Role } from 'src/role/entities/role.entity';
import { BatHo } from 'src/bat-ho/bat-ho.entity';

@Entity('user')
export class User extends SoftDeletableEntity {
  @Column()
  phoneNumber?: string;

  @Column()
  fullName?: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  managerId?: string;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_role',
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  roles: Role[];

  @OneToOne(() => User)
  @JoinColumn()
  manager: User;

  @OneToMany(() => BatHo, (batHo) => batHo.user)
  contractsBatHo: BatHo[];

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'user');
  }
}
