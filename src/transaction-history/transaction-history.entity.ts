import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { SoftDeletableEntity } from 'src/common/database/solf-deletetable.entity';
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

@Entity('transaction_history')
export class TransactionHistory extends SoftDeletableEntity {
  @Column()
  batHoId: string;

  @Column()
  pawnId: string;

  @Column()
  userId: string;

  @Column()
  createAt: Date;

  @Column()
  type: string;

  @Column()
  contractId: string;

  @Column()
  otherMoney: number;

  @Column()
  moneyAdd: number;

  @Column()
  moneySub: number;

  @Column()
  note?: string;

  @Column()
  content: string;

  @ManyToOne(() => BatHo, (batHo) => batHo.paymentHistories)
  batHo: BatHo;

  @ManyToOne(() => Pawn, (pawn) => pawn.paymentHistories)
  pawn: Pawn;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'tsh');
  }
}
