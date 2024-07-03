import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'created_at' })
  created_at: Date;

  @Column({ name: 'updated_at' })
  updated_at: Date;
}
