import { Injectable } from '@nestjs/common';
import { PathImpl2 } from '@nestjs/config';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { I18nTranslations } from 'src/common/generated/i18n.generated';

@Injectable()
export class I18nCustomService {
  constructor(private readonly i18n: I18nService<I18nTranslations>) {}

  getMessage(
    key: PathImpl2<I18nTranslations>,
    args?: { [k: string]: PathImpl2<I18nTranslations> } | Record<string, any>,
    options?: TranslateOptions,
  ) {
    const translateOptions = options ?? {};
    return this.i18n.translate(key, {
      lang: I18nContext.current()?.lang,
      ...translateOptions,
      args,
    }) as string;
  }
}
