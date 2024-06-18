import { SoftDeletableEntity } from 'src/common/database/solf-deletetable.entity';
import { Partner, ServiceFee } from 'src/bat-ho/bat-ho.type';
import { generateEntityId } from 'src/common/utils/generated-id';
import { Customer } from 'src/customer/customer.entity';
import { Device } from 'src/device/device.entity';
import { HostServer } from 'src/host-server/host-server.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { User } from 'src/user/user.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity('bat_ho')
export class BatHo extends SoftDeletableEntity {
  @Column()
  customerId: string;

  @Column()
  deviceId: string;

  @Column()
  hostServerId: string;

  @Column()
  contractId: string;

  @Column()
  userId?: string;

  @Column()
  oldContractId?: string;

  @Column()
  debitStatus: string;

  @Column()
  loanAmount: number;

  @Column()
  fundedAmount: number;

  @Column()
  revenueReceived: number;

  @Column()
  loanDurationDays: number;

  @Column()
  deductionDays: number;

  @Column()
  noteContract?: string;

  @Column()
  loanDate: string;

  @Column()
  maturityDate?: string;

  @Column()
  imei?: string;

  @Column({ type: 'jsonb', nullable: true })
  serviceFee: ServiceFee;

  @Column({ type: 'jsonb', nullable: true })
  partner?: Partner;

  @ManyToOne(() => Customer, (customer) => customer.batHos)
  customer: Customer;

  @OneToMany(() => PaymentHistory, (paymentHistory) => paymentHistory.batHo)
  paymentHistories: PaymentHistory[];

  @OneToMany(
    () => TransactionHistory,
    (transactionHistory) => transactionHistory.batHo,
  )
  transactionHistories: TransactionHistory[];

  @ManyToOne(() => User, (user) => user.contractsBatHo)
  user: User;

  @OneToOne(() => Device)
  @JoinColumn()
  device: Device;

  @OneToOne(() => HostServer)
  @JoinColumn()
  hostServer: HostServer;

  @Column({ type: 'character varying' })
  files?: string[];

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'bat_ho');
  }
}
