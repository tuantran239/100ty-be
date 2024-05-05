import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class SoftDeletableEntity extends BaseEntity {
  @Column()
  deleted_at: Date | null;
}
