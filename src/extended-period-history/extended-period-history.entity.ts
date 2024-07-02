import { SoftDeletableEntity } from 'src/common/entity/soft-deletable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { Pawn } from 'src/pawn/pawn.entity';
import { BeforeInsert, Column, Entity, ManyToOne } from 'typeorm';

@Entity('extended_period_history')
export class ExtendedPeriodHistory extends SoftDeletableEntity {
  @Column()
  periodNumber: number;

  @Column()
  extendedDate: string;

  @Column()
  reason: string;

  @Column()
  pawnId: string;

  @ManyToOne(() => Pawn, (pawn) => pawn.extendedPeriodHistories)
  pawn: Pawn;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'extended_period_history');
  }
}
