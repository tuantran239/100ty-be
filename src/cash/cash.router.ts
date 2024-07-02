import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

interface CashRouter extends BaseRouter {
  TOTAL: string;
  FILTER_TYPE: string;
}

export const CashRouter: CashRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/cash`,
  TOTAL: '/count/total',
  FILTER_TYPE: '/filter/type',
};
