import { Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { BaseRepository } from '../repository/base.repository';
import { SoftDeletableEntity } from '../database/soft-deletable.entity';

@Injectable()
export abstract class NewBaseService<
  E extends SoftDeletableEntity,
  C,
  U,
  Q,
  R,
  CR extends BaseRepository<E, C, U, R>,
> {
  constructor(
    public readonly repository: CR,
    protected entity: string,
    public subject: string,
    protected isDeleteDatabase: boolean = false,
  ) {
    this.entity = entity;
    this.subject = subject;
    this.isDeleteDatabase = isDeleteDatabase;
  }

  async create(payload: C): Promise<E> {
    return await this.repository.createAndSave(payload);
  }

  async update(id: string, payload: U): Promise<E> {
    return await this.repository.updateAndSave({ ...payload, id });
  }

  async delete(id: string): Promise<E> {
    return await this.repository.deleteData({ where: { id } } as any);
  }

  async remove(id: string): Promise<E> {
    return await this.repository.deleteSoft({ where: { id } } as any);
  }

  async list(
    options: FindManyOptions<E>,
  ): Promise<{ results: E[]; total: number }> {
    const data = await this.repository.findAndCount(options);

    return { results: data[0], total: data[1] };
  }

  async retrieve(options: FindOneOptions<E>): Promise<E> {
    return await this.repository.findOne(options);
  }

  abstract listByQuery(query: Q): Promise<{ results: E[]; total: number }>;

  abstract retrieveMapResponse(options: FindOneOptions<E>): Promise<E>;
}
