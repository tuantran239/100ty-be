import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { BaseStoreEntity } from 'src/common/entity/base-store.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { Pawn } from 'src/pawn/pawn.entity';
import { User } from 'src/user/user.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

@Entity('payment_history')
export class PaymentHistory extends BaseStoreEntity {
  @Column()
  rowId: number;

  @Column()
  batHoId: string;

  @Column()
  pawnId: string;

  @Column()
  userId: string;

  @Column()
  paymentStatus?: string;

  @Column()
  payDate: string;

  @Column()
  type: string;

  @Column()
  isDeductionMoney?: boolean;

  @Column()
  isMaturity?: boolean;

  @Column()
  isRootMoney?: boolean;

  @Column()
  startDate: string;

  @Column()
  endDate: string;

  @Column()
  paymentMethod: string;

  @Column()
  contractType: string;

  @Column()
  contractId: string;

  @Column()
  interestMoney: number;

  @Column()
  otherMoney: number;

  @Column()
  payMoney: number;

  @Column()
  payNeed: number;

  @Column()
  note?: string;

  @ManyToOne(() => BatHo, (batHo) => batHo.paymentHistories)
  batHo: BatHo;

  @ManyToOne(() => Pawn, (pawn) => pawn.paymentHistories)
  pawn: Pawn;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'payment_history');
  }
}
