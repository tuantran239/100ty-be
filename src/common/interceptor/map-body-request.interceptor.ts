import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { EntitiesInWorkspace } from 'src/workspace/workspace.data';
import { RequestCustom } from '../types/http';
import { convertUrlToSubject } from '../utils/convert';

@Injectable()
export class MapBodyRequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest() as RequestCustom;

    const user = req.user as UserResponseDto;

    const entity = convertUrlToSubject(req.url as string);

    req.body = {
      ...req.body,
      userId: user?.id,
      user: { ...user },
    };

    req.defaultQuery = {
      userId: user?.id,
      me: { ...user } as any,
    };

    if (EntitiesInWorkspace.find((ew) => ew.key === entity)) {
      req.body = {
        ...req.body,
        workspaceId: user?.workspaceId,
      };

      req.defaultQuery = {
        ...req.defaultQuery,
        workspaceId: user?.workspaceId,
      };
    }

    if (EntitiesInWorkspace.find((ew) => ew.key === entity)) {
      req.body = {
        ...req.body,
        workspaceId: user?.workspaceId,
        storeId: user?.storeId,
      };

      req.defaultQuery = {
        ...req.defaultQuery,
        workspaceId: user?.workspaceId,
        storeId: user?.storeId,
      };
    }

    return next.handle().pipe(tap(() => {}));
  }
}
