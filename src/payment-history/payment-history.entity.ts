import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { SoftDeletableEntity } from 'src/common/database/solf-deletetable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
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
export class PaymentHistory extends SoftDeletableEntity {
  @Column()
  rowId: number;

  @Column()
  batHoId: string;

  @Column()
  userId: string;

  @Column()
  paymentStatus?: string;

  @Column()
  payDate: string;

  @Column()
  isDeductionMoney?: boolean;

  @Column()
  isMaturity?: boolean;

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

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'payment_history');
  }
}
