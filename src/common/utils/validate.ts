import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { DatabaseService } from 'src/database/database.service';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { InitRoleData } from 'src/role/role.data';
import { RoleId } from 'src/role/role.type';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { ICheckRole } from '../decorator/roles.decorator';
import { convertConstraintsToErrorMessage } from './convert';
import { RequestCustom } from '../types/http';

export const checkEnumTypeValid = (
  enumType: Record<string, string>,
  inputs: string[],
  errorMessage?: string,
  notThrowError?: boolean,
) => {
  const enumValues = Object.values(enumType);

  const isValid =
    inputs.length > 0 && inputs.every((input) => enumValues.includes(input));

  if (!isValid && !notThrowError) {
    throw new Error(errorMessage ?? 'Invalid enum type');
  }

  return isValid;
};

export const checkBodyValid = async (
  metadata: any,
  payload: Record<string, any>,
  i18n: I18nCustomService,
) => {
  const keys = Object.keys(payload);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    metadata[key] = payload[key];
  }

  const errors = await validate(metadata);

  const validationError = convertConstraintsToErrorMessage(errors, i18n);

  if (errors.length > 0) {
    throw new BadRequestException(
      validationError.length > 0 ? validationError : 'Validation failed',
    );
  }
};

export const checkRoleValid = async (
  req: RequestCustom,
  requiredRoles: ICheckRole[],
  i18n: I18nCustomService,
  databaseService: DatabaseService,
  entity: string,
) => {
  if (!requiredRoles) {
    return true;
  }

  const me = req.user as UserResponseDto;

  const id = req.params.id as string;

  const requiredRoleMe = requiredRoles.find((role) => role.id === me?.role?.id);

  if (!requiredRoleMe) {
    throw new ForbiddenException(
      i18n.getMessage('errors.common.access_denied_permission'),
    );
  }

  if (requiredRoleMe.conditions?.levelRole && req.body?.role_id) {
    const roleId = req.body.role_id;

    const role = InitRoleData.find((role) => role.id === roleId);

    if (!role) {
      throw new ForbiddenException(
        i18n.getMessage('errors.common.not_valid', {
          field: i18n.getMessage('args.field.role_id'),
        }),
      );
    }

    if (me.role.level <= role.level && me.roleId !== RoleId.SUPER_ADMIN) {
      throw new ForbiddenException(
        i18n.getMessage('errors.common.access_denied_permission'),
      );
    }
  }

  if (id && requiredRoleMe.conditions) {
    const entityRecord = (
      await databaseService.query.selectById(entity, id)
    )[0] as any;

    if (!entityRecord) {
      throw new NotFoundException(
        i18n.getMessage('errors.common.not_found', {
          entity: 'record',
        }),
      );
    }

    const userId = entityRecord.userId ?? entityRecord.managerId;

    if (!userId) {
      return true;
    }

    const { userRepository } = databaseService.getRepositories();

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    const { levelRole, createdBy } = requiredRoleMe.conditions;

    if (levelRole) {
      if (user.role.level < me.role.level) {
        throw new ForbiddenException(
          i18n.getMessage('errors.common.access_denied_permission'),
        );
      }
    }

    if (createdBy) {
      if (user.id !== me.id && user.managerId !== me.id) {
        throw new ForbiddenException(
          i18n.getMessage('errors.common.access_denied_permission'),
        );
      }
    }
  }

  return true;
};
