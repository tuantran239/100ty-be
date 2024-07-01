import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

interface TransactionHistoryRouter extends BaseRouter {
  CONVERT_TRANSACTION_HISTORY_PAYMENT_HISTORY: string;
  UPDATE_CONTRACT_TYPE: string;
}

export const TransactionHistoryRouter: TransactionHistoryRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/transaction-history`,
  CONVERT_TRANSACTION_HISTORY_PAYMENT_HISTORY:
    '/convert-transaction-history-payment-history',
  UPDATE_CONTRACT_TYPE: '/update-contract-type',
};
