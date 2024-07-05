import { BaseWorkspaceEntity } from 'src/common/entity/base-workspace.entity';
import { User } from 'src/user/user.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('group_cash')
export class GroupCash extends BaseWorkspaceEntity {
  @Column()
  groupName: string;

  @Column()
  cashType: string;

  @Column()
  status: string;

  @Column()
  type: string;

  @Column()
  userId?: string;

  @OneToOne(() => User)
  @JoinColumn()
  user?: User;
}
