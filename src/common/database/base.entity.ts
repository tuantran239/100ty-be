import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;
}
