import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import { Device } from './device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';

@Injectable()
@Injectable()
export class DeviceService extends BaseService<
  Device,
  CreateDeviceDto,
  UpdateDeviceDto
> {
  protected manager: EntityManager;
  private deviceRepository: Repository<Device>;
  constructor(private dataSource: DataSource) {
    super();
    this.manager = this.dataSource.manager;
    this.deviceRepository = this.dataSource.manager.getRepository(Device);
  }

  async create(payload: CreateDeviceDto): Promise<Device> {
    const newDevice = await this.deviceRepository.create(payload);
    return await this.deviceRepository.save(newDevice);
  }

  async update(id: string, payload: UpdateDeviceDto): Promise<any> {
    const device = await this.deviceRepository.findOne({ where: { id } });

    if (!device) {
      throw new Error('Không tìm thấy thiết bị');
    }

    return await this.deviceRepository.update(
      { id },
      {
        ...payload,
      },
    );
  }

  async delete(id: string): Promise<any> {
    return await this.deviceRepository.delete({ id });
  }

  async list(options: FindManyOptions<Device>): Promise<Device[]> {
    return this.deviceRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<Device>,
  ): Promise<[Device[], number]> {
    return this.deviceRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<Device> {
    return this.deviceRepository.findOne({ where: { id } });
  }

  retrieveOne(options: FindOneOptions<Device>): Promise<Device> {
    return this.deviceRepository.findOne(options);
  }
}
