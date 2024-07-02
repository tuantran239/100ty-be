import { Global, Module } from '@nestjs/common';
import { I18nCustomService } from './i18n-custom.service';
import { I18nModule, I18nService } from 'nestjs-i18n';

@Global()
@Module({
  providers: [I18nCustomService],
  exports: [I18nCustomService],
})
export class I18nCustomModule {}
