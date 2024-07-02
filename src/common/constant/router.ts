export interface BaseRouter {
  ROOT: string;
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  LIST: string;
  RETRIEVE: string;
  REMOVE: string;
}

export const API_URL = '/api';

export const BaseRouterUrl: BaseRouter = {
  ROOT: '/',
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
  REMOVE: '/remove/:id',
};
