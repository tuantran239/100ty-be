import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { BaseStoreEntity } from 'src/common/entity/base-store.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { Role } from 'src/role/entities/role.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne
} from 'typeorm';
import { generateEntityId } from '../common/utils/generated-id';

@Entity('user')
export class User extends BaseStoreEntity {
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

  @Column()
  roleId?: string;

  @OneToOne(() => User)
  @JoinColumn()
  manager: User;

  @OneToOne(() => Role)
  @JoinColumn()
  role: Role;

  @OneToMany(() => BatHo, (batHo) => batHo.user)
  contractsBatHo: BatHo[];

  @OneToMany(() => Pawn, (pawn) => pawn.user)
  contractsPawn: Pawn[];

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'user');
  }
}
