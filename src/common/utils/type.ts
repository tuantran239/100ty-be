export const getValueNestedField = (
  obj: Record<string, any>,
  nestedField: string,
  type: 'number' | 'string' | 'object' | 'boolean',
) => {
  let result: any = { ...obj };
  const fields = nestedField.split('.');

  let index = 0;

  while (index < fields.length) {
    const field = fields[index];
    const fieldValue = result[field] ?? undefined;

    if (typeof fieldValue === 'undefined') {
      return undefined;
    }

    result = fieldValue;

    index++;
  }

  return typeof result === type ? result : undefined;
};
