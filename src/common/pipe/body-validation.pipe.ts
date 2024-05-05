import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Logger,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class BodyValidationPipe implements PipeTransform<any> {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    let validation_error = '';

    for (let i = 0; i < errors.length; i++) {
      const error = errors[i];
      validation_error +=
        Object.keys(error.constraints ?? {})
          .map((key) => error.constraints[key])
          .join(',') + ',';
    }

    if (errors.length > 0) {
      this.logger.error('>>>>>>> Error validate', errors);
      throw new BadRequestException(
        validation_error.length > 0 ? validation_error : 'Validation failed',
      );
    }
    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
