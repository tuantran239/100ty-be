import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

export interface BatHoRouter extends BaseRouter {
    INFO: string;
    CLOSE: string;
    REMOVE: string;
    CHECK_UPDATE: string;
    SETTLEMENT: string;
    REVERSE_CONTRACT: string;
}
  

export const BatHoRouter: BatHoRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/bat-ho`,
  INFO: '/info/:id',
  CLOSE: '/close/:id',
  CHECK_UPDATE: 'check-update',
  SETTLEMENT: '/settlement/:id',
  REVERSE_CONTRACT: '/reverse-contract/:id',
};
