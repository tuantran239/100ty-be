import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseRepository,
  CheckValid,
  CreateAndSaveCheckValid,
  MapPayload,
} from 'src/common/repository/base.repository';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ActiveStatus } from 'src/common/types/status';
import { Workspace } from './workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';

const STORE_RELATIONS = [];

export class WorkspaceRepository extends BaseRepository<
  Workspace,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceResponseDto
> {
  constructor(
    @InjectRepository(Workspace)
    protected repository: Repository<Workspace>,
    public i18n: I18nCustomService,
  ) {
    super(repository, STORE_RELATIONS, i18n, repository.target, 'workspace');
  }

  setCheckValid(
    payload: CreateWorkspaceDto | UpdateWorkspaceDto,
  ): CheckValid<Workspace> {
    const codeUnique: CreateAndSaveCheckValid<Workspace> = {
      type: 'unique',
      message: this.i18n.getMessage('errors.common.existed', {
        field: this.i18n.getMessage('args.field.code'),
        entity: this.i18n.getMessage('args.entity.workspace'),
        value: payload.code,
      }),
      options: {
        where: {
          code: payload.code,
        },
      },
      field: 'code',
    };

    const statusEnumType: CreateAndSaveCheckValid<Workspace> = {
      type: 'enum_type',
      message: this.i18n.getMessage('errors.common.not_valid', {
        field: this.i18n.getMessage('args.field.status'),
      }),
      options: {
        enumType: ActiveStatus,
        inputs: [payload.status],
      },
      field: 'status',
    };

    const notFound: CreateAndSaveCheckValid<Workspace> = {
      type: 'not_found',
      message: this.i18n.getMessage('errors.common.not_found', {
        entity: this.i18n.getMessage('args.entity.workspace'),
      }),
      options: {
        where: {
          id: (payload as UpdateWorkspaceDto).id,
        },
      },
      field: 'id',
    };

    const createAndSave: CreateAndSaveCheckValid<Workspace>[] = [codeUnique];

    const updateAndSave: CreateAndSaveCheckValid<Workspace>[] = [
      notFound,
      codeUnique,
      statusEnumType,
    ];

    if (payload.status) {
      createAndSave.push(statusEnumType);
    }

    return { createAndSave, updateAndSave };
  }

  setQueryDefault(
    payload?: Record<string, any> | CreateWorkspaceDto | UpdateWorkspaceDto,
  ): FindOptionsWhere<Workspace> {
    return {};
  }

  mapResponse(payload: Workspace): WorkspaceResponseDto {
    return payload;
  }

  async mapPayload(
    data: MapPayload<CreateWorkspaceDto, UpdateWorkspaceDto>,
  ): Promise<any> {
    const { type, payload } = data;

    if (type === 'create') {
      payload.status = payload.status ?? ActiveStatus.ACTIVE;
      return payload as any;
    } else if (type === 'update') {
      return payload;
    }
  }
}
