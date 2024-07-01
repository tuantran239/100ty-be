import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class SoftDeletableEntity extends BaseEntity {
  @Column({ name: 'deleted_at' })
  deleted_at: Date | null;
}
