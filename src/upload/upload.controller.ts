import {
  Body,
  Controller,
  FileTypeValidator,
  InternalServerErrorException,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { API_URL } from 'src/common/constant/router';
import { ResponseData } from 'src/common/types';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { UploadDto } from './dto/upload-dto';

const file_validators = [
  new MaxFileSizeValidator({
    maxSize: 10000000,
    message: 'File max size: 10MB',
  }),
  new FileTypeValidator({
    fileType: /.(gif|jpe?g|tiff?|png|webp|bmp)$/i,
  }),
];

const ENTITY_LOG = 'Upload';

@ApiTags('Upload')
@Controller(`${API_URL}/upload`)
export class UploadController {
  constructor(
    private cloudinaryService: CloudinaryService,
    private logger: LoggerServerService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: file_validators,
      }),
    )
    file: Express.Multer.File,
    @Res() res: Response,
    @Body(new BodyValidationPipe()) payload: UploadDto,
  ) {
    try {
      this.logger.log(
        { loggerType: 'update', entity: ENTITY_LOG, serverType: 'request' },
        { ...file, buffer: undefined },
      );

      const response = await this.cloudinaryService.uploadFile(file, {
        filename_override: file.originalname,
        use_filename: true,
        discard_original_filename: true,
        overwrite: true,
        backup: true,
        folder: payload.folder ?? 'images',
      });

      const responseData: ResponseData = {
        statusCode: 200,
        error: null,
        data: { url: response.secure_url },
        message: 'success',
      };

      return res.status(200).send(responseData);
    } catch (error) {
      this.logger.error(
        { loggerType: 'create', entity: ENTITY_LOG, serverType: 'error' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('/multi')
  @UseInterceptors(FilesInterceptor('file'))
  async uploadMulti(
    @UploadedFiles(
      new ParseFilePipe({
        validators: file_validators,
      }),
    )
    files: Array<Express.Multer.File>,
    @Res() res: Response,
    @Body(new BodyValidationPipe()) payload: UploadDto,
  ) {
    this.logger.log(
      { loggerType: 'update', entity: ENTITY_LOG, serverType: 'request' },
      files.map((file) => ({ ...file, buffer: undefined })),
    );
    try {
      const responses = files.map(async (file) => {
        const response = await this.cloudinaryService.uploadFile(file, {
          filename_override: file.originalname,
          use_filename: true,
          discard_original_filename: true,
          overwrite: true,
          backup: true,
          folder: payload.folder ?? 'images',
        });
        return response;
      });

      const uploads = await Promise.all(responses);

      const responseData: ResponseData = {
        statusCode: 200,
        error: null,
        data: { urls: uploads.map((u) => u.secure_url) },
        message: 'success',
      };

      return res.status(200).send(responseData);
    } catch (error) {
      this.logger.error(
        { loggerType: 'create', entity: ENTITY_LOG, serverType: 'error' },
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }
}
