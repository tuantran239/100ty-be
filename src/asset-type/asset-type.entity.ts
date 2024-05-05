import { SoftDeletableEntity } from 'src/common/database/solf-deletetable.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('asset_type')
export class AssetType extends SoftDeletableEntity {
  @Column()
  name: string;

  @Column()
  status: string;

  @OneToMany(() => Pawn, (pawn) => pawn.assetType)
  pawns: Pawn[];
}
