import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { BaseWorkspaceEntity } from 'src/common/entity/base-workspace.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { Pawn } from 'src/pawn/pawn.entity';
import { User } from 'src/user/user.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

@Entity('customer')
export class Customer extends BaseWorkspaceEntity {
  @Column()
  userId?: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'character varying' })
  images?: string[];

  @Column()
  personalID: string;

  @Column()
  phoneNumber: string;

  @Column()
  releaseDate?: string;

  @Column()
  publishedPlace?: string;

  @Column()
  dateOfBirth?: string;

  @Column()
  address?: string;

  @Column()
  isDebt: boolean;

  @Column()
  debtMoney: number;

  @Column({ type: 'jsonb', nullable: true })
  customerInfo?: Record<string, unknown>;

  @OneToMany(() => BatHo, (batHo) => batHo.customer)
  batHos: BatHo[];

  @OneToMany(() => Pawn, (pawn) => pawn.customer)
  pawns: Pawn[];

  @OneToOne(() => User)
  @JoinColumn()
  user?: User;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'cus');
  }
}
