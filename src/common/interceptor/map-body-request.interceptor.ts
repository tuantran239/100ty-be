import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { convertUrlToSubject } from '../utils/convert';
import { EntitiesInWorkspace } from 'src/workspace/workspace.data';

@Injectable()
export class MapBodyRequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest() as Request;

    const user = req.user as UserResponseDto;

    const entity = convertUrlToSubject(req.url as string);

    req.body = {
      ...req.body,
      userId: user?.id,
      me: { ...user },
    };

    if (EntitiesInWorkspace.find((ew) => ew.key === entity)) {
      req.body = {
        ...req.body,
        workspaceId: user?.workspaceId,
      };
    }

    if (EntitiesInWorkspace.find((ew) => ew.key === entity)) {
      req.body = {
        ...req.body,
        workspaceId: user?.workspaceId,
        storeId: user?.storeId,
      };
    }

    return next.handle().pipe(tap(() => {}));
  }
}
