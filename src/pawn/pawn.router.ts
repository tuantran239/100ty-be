import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

interface PawnRouter extends BaseRouter {
  REMOVE: string;
  INFO: string;
  PERIOD_TYPE: string;
  SETTLEMENT_REQUEST: string;
  SETTLEMENT_CHANGE: string;
  SETTLEMENT_CONFIRM: string;
  PAYMENT_DOWN_REQUEST: string;
  PAYMENT_DOWN_CONFIRM: string;
  LOAN_MORE_REQUEST: string;
  LOAN_MORE_CONFIRM: string;
  EXTENDED_PERIOD_REQUEST: string;
  EXTENDED_PERIOD_CONFIRM: string;
}

export const PawnRouter: PawnRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/pawn`,
  INFO: '/info/:id',
  PERIOD_TYPE: '/period-type',
  SETTLEMENT_REQUEST: '/settlement/request/:id',
  SETTLEMENT_CHANGE: '/settlement/change/:id',
  SETTLEMENT_CONFIRM: '/settlement/confirm/:id',
  PAYMENT_DOWN_REQUEST: '/payment-down/request/:id',
  PAYMENT_DOWN_CONFIRM: '/payment-down/confirm/:id',
  LOAN_MORE_REQUEST: '/loan-more/request/:id',
  LOAN_MORE_CONFIRM: '/loan-more/confirm/:id',
  EXTENDED_PERIOD_REQUEST: '/extended-period/request/:id',
  EXTENDED_PERIOD_CONFIRM: '/extended-period/confirm/:id',
};
