import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { SoftDeletableEntity } from 'src/common/database/solf-deletetable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { Customer } from 'src/customer/customer.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { User } from 'src/user/user.entity';
import { BeforeInsert, Column, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity('pawn')
export class Pawn extends SoftDeletableEntity {
  @Column()
  customerId: string;

  @Column()
  userId?: string;

  @Column()
  assetTypeId: string;

  @Column()
  contractId: string;

  @Column()
  loanPaymentType: string;

  @Column()
  assetName: string;

  @Column()
  loanAmount: number;

  @Column()
  interestMoney: number;

  @Column()
  paymentPeriod: number;

  @Column()
  paymentPeriodType: string;

  @Column()
  numOfPayment: number;

  @Column()
  loanDate: string;

  @Column()
  debitStatus: string;

  @Column()
  noteContract?: string;

  @Column()
  revenueReceived: number;

  @Column({ type: 'jsonb', nullable: true })
  pawnInfo?: Record<string, unknown>;

  @Column({ type: 'character varying' })
  files?: string[];

  @ManyToOne(() => User, (user) => user.contractsPawn)
  user: User;

  @ManyToOne(() => Customer, (customer) => customer.pawns)
  customer: Customer;

  @ManyToOne(() => AssetType, (assetType) => assetType.pawns)
  assetType: AssetType;

  @OneToMany(
    () => TransactionHistory,
    (transactionHistory) => transactionHistory.pawn,
  )
  transactionHistories: TransactionHistory[];

  @OneToMany(() => PaymentHistory, (paymentHistory) => paymentHistory.pawn)
  paymentHistories: PaymentHistory[];

  @Column({ type: 'jsonb', nullable: true })
  serviceFee: any;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'pawn');
  }
}
