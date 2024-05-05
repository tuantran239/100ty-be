import { Injectable } from '@nestjs/common';
import {
  AdminAndResourceOptions,
  ConfigAndUrlOptions,
  DeliveryType,
  ImageTransformationAndTagsOptions,
  ResourceType,
  UploadApiOptions,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';

const streamifier = require('streamifier');

export type CloudinaryResponse = UploadApiResponse;

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    options?: UploadApiOptions,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { ...options, chunk_size: 1000000, unique_filename: true },
        (error, result) => {
          if (error) {
            throw new Error(error.message);
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async getFile(public_id: string, options?: AdminAndResourceOptions) {
    return await cloudinary.api.resource(public_id, options);
  }

  async createImageTag(
    public_id: string,
    options?: ImageTransformationAndTagsOptions | ConfigAndUrlOptions,
  ) {
    return cloudinary.image(public_id, options);
  }

  async removeFile(
    public_id: string,
    options?: {
      resource_type?: ResourceType;
      type?: DeliveryType;
      invalidate?: boolean;
    },
  ) {
    return await cloudinary.uploader.destroy(public_id, options);
  }
}
