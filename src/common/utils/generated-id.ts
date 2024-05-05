import { ulid } from 'ulid';

export function generateEntityId(idProperty?: string, prefix?: string): string {
  if (idProperty) {
    return idProperty;
  }

  const id = ulid();
  prefix = prefix ? `${prefix}_` : '';
  return `${prefix}${id}`;
}

export function generatePrefixNumberId(prefix?: string): string {
  const id = (new Date().getTime() + parseInt((Math.random() * 10).toString()))
    .toString()
    .slice(-6);
  prefix = prefix ? `${prefix}_` : '';
  return `${prefix}${id}`;
}
