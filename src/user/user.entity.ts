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
import { SoftDeletableEntity } from '../common/database/soft-deletable.entity';
import { generateEntityId } from '../common/utils/generated-id';
import { Role } from 'src/role/entities/role.entity';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { Pawn } from 'src/pawn/pawn.entity';

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
