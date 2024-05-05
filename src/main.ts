import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

import 'dotenv/config';
import { BodyValidationPipe } from './common/pipe/body-validation.pipe';
import { AllExceptionsFilter } from './common/exception-filter/all-exception-filter';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import * as cookieParser from 'cookie-parser';

const PORT = parseInt(process.env.PORT, 10) || 9000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const httpAdapter = app.get(HttpAdapterHost);

  const whiteList = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://100ty.net',
    'https://dev.100ty.net',
  ];

  app.enableCors({
    origin: whiteList,
    credentials: true,
  });

  app.use(cookieParser());

  app.use(helmet());

  app.useGlobalPipes(new BodyValidationPipe());

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const config = new DocumentBuilder()
    .setTitle('100ty example')
    .setDescription('The 100ty API description')
    .setVersion('1.0')
    .addTag('auth')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(PORT);
}
bootstrap();
