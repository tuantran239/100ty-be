import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

interface CustomerRouter extends BaseRouter {
  TRANSACTION_HISTORY: string;
}

export const CustomerRouter: CustomerRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/customers`,
  TRANSACTION_HISTORY: '/transaction-history/:id',
};
