import { SoftDeletableEntity } from 'src/common/database/soft-deletable.entity';
import { generateEntityId } from 'src/common/utils/generated-id';
import { BeforeInsert, Column, Entity } from 'typeorm';

@Entity('host_server')
export class HostServer extends SoftDeletableEntity {
  @Column()
  name: string;

  @Column()
  supervisor: string;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'hs');
  }
}
