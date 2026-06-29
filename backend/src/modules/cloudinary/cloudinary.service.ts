import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { CLOUDINARY } from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof Cloudinary,
  ) {}

  uploadImage(
    buffer: Buffer,
    options: { folder: string; publicId?: string },
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          public_id: options.publicId,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 512, height: 512, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException('Image upload failed'),
            );
          }
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await this.cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });
    } catch {}
  }
}
