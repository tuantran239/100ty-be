import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { BaseCreateDto } from '../dto/base-create.dto';
import { BaseStoreCreateDto } from '../dto/base-store-create.dto';
import { BaseUpdateDto } from '../dto/base-update.dto';
import { Request } from 'express';
import { BaseStoreUpdateDto } from '../dto/base-store-update.dto';
import { BaseQueryDto } from '../dto/base-query.dto';
import { BaseDto } from '../dto/base.dto';

export interface DefaultQuery {
  workspaceId?: string;
  storeId?: string;
  userId?: string;
  me: UserResponseDto;
}

export interface RequestCustom extends Request {
  user: UserResponseDto;
  body:
    | BaseCreateDto
    | BaseStoreCreateDto
    | BaseUpdateDto
    | BaseStoreUpdateDto
    | BaseQueryDto
    | BaseDto
    | Record<string, any>
    | any;
  defaultQuery: DefaultQuery;
}
