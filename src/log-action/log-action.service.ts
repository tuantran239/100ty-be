import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import { LogAction } from './log-action.entity';
import { CreateLogActionDto } from './dto/create-log-action.dto';
import { UpdateLogActionDto } from './dto/update-log-action.dto';
import {
  EntityManager,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  Repository,
  DataSource,
} from 'typeorm';

@Injectable()
export class LogActionService extends BaseService<
  LogAction,
  CreateLogActionDto,
  UpdateLogActionDto
> {
  protected manager: EntityManager;
  private logActionRepository: Repository<LogAction>;
  constructor(private dataSource: DataSource) {
    super();
    this.manager = this.dataSource.manager;
    this.logActionRepository = this.dataSource.manager.getRepository(LogAction);
  }

  async create(payload: CreateLogActionDto): Promise<LogAction> {
    const newLog = await this.logActionRepository.create(payload);
    return await this.logActionRepository.save(newLog);
  }

  update(id: string, payload: UpdateLogActionDto): Promise<any> {
    console.log(id, payload);
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<DeleteResult> {
    console.log(id);
    throw new Error('Method not implemented.');
  }

  list(options: FindManyOptions<LogAction>): Promise<LogAction[]> {
    console.log(options);
    throw new Error('Method not implemented.');
  }

  async listAndCount(
    options: FindManyOptions<LogAction>,
  ): Promise<[LogAction[], number]> {
    return await this.logActionRepository.findAndCount(options);
  }

  retrieveById(id: string): Promise<LogAction> {
    console.log(id);
    throw new Error('Method not implemented.');
  }

  retrieveOne(options: FindOneOptions<LogAction>): Promise<LogAction> {
    console.log(options);
    throw new Error('Method not implemented.');
  }
}
