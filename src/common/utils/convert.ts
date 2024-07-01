import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';

export const convertUrlToSubject = (url: string) => {
  const subjectParam = url.split('/')[2];

  let subject = subjectParam.split('?')[0];

  subject = subject.split('-').join('_');

  return subject;
};

export const convertStringToI18nObject = (message: string) => {
  const messageArr = message.trim().split('|');

  const key = messageArr[0];

  const strObj = messageArr[1] ?? '{}';

  const obj = JSON.parse(strObj);

  const args = obj ? obj['args'] : undefined;

  return { key, args };
};

export const convertArgsI18n = (i18n: I18nCustomService, args?: any) => {
  if (!args) {
    return undefined;
  }

  const keys = Object.keys(args);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === 'field' || key === 'entity') {
      const keyValue = args[key];
      args[key] = i18n.getMessage(keyValue);
    }
  }

  return args;
};

export const convertConstraintsToErrorMessage = (
  errors: any[],
  i18n: I18nCustomService,
) => {
  let validationError = '';

  for (let i = 0; i < errors.length; i++) {
    const error = errors[i];

    validationError += Object.keys(error.constraints ?? {})
      .map((key) => {
        const constraint = error.constraints[key];

        if (constraint.includes('|')) {
          const { key, args } = convertStringToI18nObject(constraint);
          return i18n.getMessage(key as any, convertArgsI18n(i18n, args));
        }

        return i18n.getMessage(error.constraints[key].split('|')[0] as any);
      })
      .join(',');

    if (i !== errors.length - 1) {
      validationError += ',';
    }
  }

  return validationError;
};
