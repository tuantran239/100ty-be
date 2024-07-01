import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

interface PaymentHistoryRouter extends BaseRouter {
  CHECK_UPDATE: string;
  LIST_FINISH_TODAY: string;
  CONVERT_TYPE: string;
}

export const PaymentHistoryRouter: PaymentHistoryRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/payment-history`,
  CHECK_UPDATE: 'check-update',
  LIST_FINISH_TODAY: 'list-finish-today',
  CONVERT_TYPE: '/convert-type',
};
