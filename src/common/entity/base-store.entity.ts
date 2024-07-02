import { Column, JoinColumn, OneToOne } from 'typeorm';
import { SoftDeletableEntity } from './soft-deletable.entity';
import { Store } from 'src/store/store.entity';

export class BaseStoreEntity extends SoftDeletableEntity {
  @Column()
  storeId?: string;

  @OneToOne(() => Store)
  @JoinColumn()
  store?: Store;
}
