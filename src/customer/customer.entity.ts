import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { SoftDeletableEntity } from 'src/common/database/solf-deletetable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { Pawn } from 'src/pawn/pawn.entity';
import { BeforeInsert, Column, Entity, OneToMany } from 'typeorm';

@Entity('customer')
export class Customer extends SoftDeletableEntity {
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

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'cus');
  }
}
