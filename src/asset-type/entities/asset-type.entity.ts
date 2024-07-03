import { BaseWorkspaceEntity } from 'src/common/entity/base-workspace.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { AssetProperty } from './asset-property.entity';

@Entity('asset_type')
export class AssetType extends BaseWorkspaceEntity {
  @Column()
  name: string;

  @Column()
  status: string;

  @OneToMany(() => Pawn, (pawn) => pawn.assetType)
  pawns: Pawn[];

  @OneToMany(() => AssetProperty, (assetProperty) => assetProperty.assetType)
  properties: AssetProperty[];
}
