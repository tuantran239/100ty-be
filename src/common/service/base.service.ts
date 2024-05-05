import {
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
} from 'typeorm';

export abstract class BaseService<E, C, U> {
  protected abstract manager: EntityManager;
  constructor() {}

  abstract create(payload: C): Promise<E>;

  abstract update(id: string, payload: U): Promise<any>;

  abstract delete(id: string): Promise<DeleteResult>;

  abstract list(options: FindManyOptions<E>): Promise<E[]>;

  abstract listAndCount(options: FindManyOptions<E>): Promise<[E[], number]>;

  abstract retrieveById(id: string): Promise<E>;

  abstract retrieveOne(options: FindOneOptions<E>): Promise<E>;
}
