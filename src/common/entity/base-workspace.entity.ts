import { Column, JoinColumn, OneToOne } from 'typeorm';
import { SoftDeletableEntity } from './soft-deletable.entity';
import { Workspace } from 'src/workspace/workspace.entity';

export class BaseWorkspaceEntity extends SoftDeletableEntity {
  @Column()
  workspaceId: string;

  @OneToOne(() => Workspace)
  @JoinColumn()
  workspace: Workspace;
}
