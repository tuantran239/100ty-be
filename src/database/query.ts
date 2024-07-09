import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface SelectOptions {
  schema?: string;
}

@Injectable()
export class QueryDatabase {
  private schema: string = 'public';

  constructor(private dataSource: DataSource) {}

  transformOption(options?: SelectOptions) {
    const schema = options?.schema ?? this.schema;

    return { schema, ...options };
  }

  async selectById(table: string, id: string, options?: SelectOptions) {
    const { schema } = this.transformOption(options);

    return await this.dataSource.query(
      `SELECT * from ${schema}.${table} where id='${id}';`,
    );
  }

  async selectByNull(table: string, field: string, options?: SelectOptions) {
    const { schema } = this.transformOption(options);

    return await this.dataSource.query(
      `SELECT * from ${schema}.${table} where ${field} is null;`,
    );
  }
}
