import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { AssetRepositoryProvider } from './asset.repository';

@Module({
  controllers: [AssetController],
  providers: [AssetService, AssetRepositoryProvider],
})
export class AssetModule {}
