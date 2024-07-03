import { Module } from '@nestjs/common';
import { WorkspaceRepository } from './workspace.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './workspace.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace])],
  providers: [WorkspaceRepository],
})
export class WorkspaceModule {}
