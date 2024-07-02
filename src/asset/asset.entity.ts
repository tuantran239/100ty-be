import { SoftDeletableEntity } from 'src/common/entity/soft-deletable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { Customer } from 'src/customer/customer.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { Warehouse } from 'src/warehouse/warehouse.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('asset')
export class Asset extends SoftDeletableEntity {
  @Column()
  assetCode: string;

  @Column()
  assetName: string;

  @Column()
  loanAmount: number;

  @Column()
  status: string;

  @Column()
  pawnId?: string;

  @Column()
  customerId?: string;

  @Column()
  warehouseId?: string;

  @OneToOne(() => Pawn)
  @JoinColumn()
  pawn?: Pawn;

  @OneToOne(() => Customer)
  @JoinColumn()
  customer?: Pawn;

  @OneToOne(() => Warehouse)
  @JoinColumn()
  warehouse?: Warehouse;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'asset');
  }
}
