import { CreateStoreDto } from 'src/store/dto/create-store.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { CreateWorkspaceDto } from 'src/workspace/dto/create-workspace.dto';

export class InitNewWorkspaceDto {
  user: CreateUserDto;
  store: CreateStoreDto;
  workspace: CreateWorkspaceDto;
}
