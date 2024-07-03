import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ResponseData } from '../types';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private i18n: I18nCustomService,
  ) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody: ResponseData = {
      data: null,
      message: 'error',
      error:
        exception?.response?.message ??
        this.i18n.getMessage('errors.common.internal_server'),
      statusCode: httpStatus,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
