import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { SoftDeletableEntity } from 'src/common/database/soft-deletable.entity';
import { paymentHistoriesCash } from 'src/common/types';
import { generateEntityId } from 'src/common/utils/generated-id';
import { GroupCash } from 'src/group-cash/entity/group-cash.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { User } from 'src/user/user.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('cash')
export class Cash extends SoftDeletableEntity {
  @Column()
  code: string;

  @Column()
  staff: string;

  @Column()
  traders: string;

  @Column()
  type: string;

  @Column()
  filterType: string;

  @Column()
  amount: number;

  @Column()
  createAt: string;

  @Column()
  isContract?: boolean;

  @Column()
  contractType?: string;

  @Column()
  batHoId?: string;

  @Column()
  pawnId?: string;

  @Column()
  userId?: string;

  @Column()
  paymentHistoryId?: string;

  @Column()
  isDeductionMoney?: boolean;

  @Column()
  isPartner?: boolean;

  @Column()
  isInitCash?: boolean;

  @Column()
  isServiceFee?: boolean;

  @Column()
  note?: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentHistories?: paymentHistoriesCash;

  @Column()
  contractStatus?: string;

  @Column()
  contractId?: string;

  @Column()
  groupId?: string;

  @OneToOne(() => BatHo)
  @JoinColumn()
  batHo?: BatHo;

  @OneToOne(() => Pawn)
  @JoinColumn()
  pawn?: Pawn;

  @OneToOne(() => GroupCash)
  @JoinColumn()
  group: GroupCash;

  @OneToOne(() => User)
  @JoinColumn()
  user?: User;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'cash');
  }
}
