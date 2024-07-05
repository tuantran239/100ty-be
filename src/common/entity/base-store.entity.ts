import { Store } from 'src/store/store.entity';
import { Column, JoinColumn, OneToOne } from 'typeorm';
import { BaseWorkspaceEntity } from './base-workspace.entity';

export class BaseStoreEntity extends BaseWorkspaceEntity {
  @Column()
  storeId?: string;

  @OneToOne(() => Store)
  @JoinColumn()
  store?: Store;
}
