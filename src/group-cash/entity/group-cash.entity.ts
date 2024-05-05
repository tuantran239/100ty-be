import { SoftDeletableEntity } from 'src/common/database/solf-deletetable.entity';
import { Column, Entity } from 'typeorm';

@Entity('group_cash')
export class GroupCash extends SoftDeletableEntity {
  @Column()
  groupName: string;

  @Column()
  cashType: string;

  @Column()
  status: string;
}
