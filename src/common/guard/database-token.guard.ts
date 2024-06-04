import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class DatabaseTokenGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request;

    const databaseToken = request.headers['database-token'] as string;
    const databaseSecret = request.headers['database-secret'] as string;

    try {
      const { password } = (await jwt.verify(
        databaseToken,
        databaseSecret,
      )) as any;

      const passwordData = (password as string).split('_');

      const salt = passwordData[1] as string;

      const hashPassword = await bcrypt.hash(passwordData[0], salt);

      const isMatch = await bcrypt.compare(hashPassword, databaseSecret);

      if (!isMatch) {
        throw new Error('Truy cập bị từ chối, token không chính xác');
      }

      return isMatch;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
