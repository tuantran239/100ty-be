import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { CreateHostServerDto } from './dto/create-host-server.dto';
import { UpdateHostServerDto } from './dto/update-host-server.dto';
import { HostServer } from './host-server.entity';

@Injectable()
@Injectable()
export class HostServerService extends BaseService<
  HostServer,
  CreateHostServerDto,
  UpdateHostServerDto
> {
  protected manager: EntityManager;
  private hostServerRepository: Repository<HostServer>;
  constructor(private dataSource: DataSource) {
    super();
    this.manager = this.dataSource.manager;
    this.hostServerRepository =
      this.dataSource.manager.getRepository(HostServer);
  }

  async create(payload: CreateHostServerDto): Promise<HostServer> {
    const newHostServer = await this.hostServerRepository.create(payload);
    return await this.hostServerRepository.save(newHostServer);
  }

  async update(id: string, payload: UpdateHostServerDto): Promise<any> {
    const hostServer = await this.hostServerRepository.findOne({
      where: { id },
    });

    if (!hostServer) {
      throw new Error('Không tìm thấy máy chủ');
    }

    return await this.hostServerRepository.update(
      { id },
      {
        ...payload,
      },
    );
  }

  async delete(id: string): Promise<any> {
    return await this.hostServerRepository.delete({ id });
  }

  async list(options: FindManyOptions<HostServer>): Promise<HostServer[]> {
    return this.hostServerRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<HostServer>,
  ): Promise<[HostServer[], number]> {
    return this.hostServerRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<HostServer> {
    return this.hostServerRepository.findOne({ where: { id } });
  }

  retrieveOne(options: FindOneOptions<HostServer>): Promise<HostServer> {
    return this.hostServerRepository.findOne(options);
  }
}
