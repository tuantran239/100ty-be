import { ILike } from 'typeorm';

export const getSearch = (data: any, search: 'start' | 'end' | 'both') => {
  switch (search) {
    case 'start':
      return ILike(`%${data}`);
    case 'end':
      return ILike(`${data}%`);
    case 'both':
      return ILike(`%${data}%`);
    default:
      return ILike(`${data}`);
  }
};
