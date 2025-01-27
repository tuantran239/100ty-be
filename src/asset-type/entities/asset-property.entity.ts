import { SoftDeletableEntity } from 'src/common/database/soft-deletable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { BeforeInsert, Column, Entity, ManyToOne } from 'typeorm';
import { AssetType } from './asset-type.entity';

@Entity('asset_property')
export class AssetProperty extends SoftDeletableEntity {
  @Column()
  propertyName: string;

  @Column()
  assetTypeId: string;

  @ManyToOne(() => AssetType, (assetType) => assetType.properties)
  assetType: AssetType;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'ap');
  }
}
