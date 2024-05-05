import { BaseEntity } from 'src/common/database/base.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { User } from 'src/user/user.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('log_action')
export class LogAction extends BaseEntity {
  @Column()
  userId?: string;

  @Column()
  action: string;

  @Column({ type: 'jsonb', nullable: false })
  agent: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, unknown>;

  @OneToOne(() => User)
  @JoinColumn()
  user?: User;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'log');
  }
}
