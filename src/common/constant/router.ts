interface BaseRouter {
  ROOT: string;
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  LIST: string;
  RETRIEVE: string;
}

export const API_URL = '/api';

const USER: BaseRouter = {
  ROOT: `${API_URL}/users`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
};

interface CustomerRouter extends BaseRouter {
  TRANSACTION_HISTORY: string;
}

const CUSTOMER: CustomerRouter = {
  ROOT: `${API_URL}/customers`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
  TRANSACTION_HISTORY: '/transaction-history/:id',
};

const ROLE: BaseRouter = {
  ROOT: `${API_URL}/role`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
};

interface CashRouter extends BaseRouter {
  TOTAL: string;
  FILTER_TYPE: string;
}

const CASH: CashRouter = {
  ROOT: `${API_URL}/cash`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
  TOTAL: '/count/total',
  FILTER_TYPE: '/filter/type',
};

interface BatHoRouter extends BaseRouter {
  INFO: string;
  CLOSE: string;
  REMOVE: string;
  CHECK_UPDATE: string;
  SETTLEMENT: string;
  REVERSE_CONTRACT: string;
}

const BAT_HO: BatHoRouter = {
  ROOT: `${API_URL}/bat-ho`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
  INFO: '/info/:id',
  CLOSE: '/close/:id',
  REMOVE: '/remove/:id',
  CHECK_UPDATE: 'check-update',
  SETTLEMENT: '/settlement/:id',
  REVERSE_CONTRACT: '/reverse-contract/:id',
};

interface PawnRouter extends BaseRouter {
  REMOVE: string;
  INFO: string;
}

const PAWN: PawnRouter = {
  ROOT: `${API_URL}/pawn`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
  REMOVE: '/remove/:id',
  INFO: '/info/:id',
};

interface PaymentHistoryRouter extends BaseRouter {
  CHECK_UPDATE: string;
  LIST_FINISH_TODAY: string;
}

const PAYMENT_HISTORY: PaymentHistoryRouter = {
  ROOT: `${API_URL}/payment-history`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
  CHECK_UPDATE: 'check-update',
  LIST_FINISH_TODAY: 'list-finish-today',
};

const AUTH = {
  ROOT: `${API_URL}/auth`,
  ME: '/me',
  LOGIN: '/signin',
  REGISTER: '/signup',
  LOGOUT: 'logout',
};

const DEVICE: BaseRouter = {
  ROOT: `${API_URL}/device`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
};

const HOST_SERVER: BaseRouter = {
  ROOT: `${API_URL}/host-server`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
};

const LOG_ACTION: BaseRouter = {
  ROOT: `${API_URL}/log-action`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
};

interface StatisticsRouter {
  ROOT: string;
  FEE_SERVICE: string;
  PARTNER: string;
  HOME_PREVIEW: string;
  STATISTICS_CONTRACT: string;
  PROFIT: string;
}

const STATISTICS: StatisticsRouter = {
  ROOT: `${API_URL}/statistics`,
  FEE_SERVICE: '/fee-service',
  PARTNER: '/partner',
  HOME_PREVIEW: '/home-preview',
  STATISTICS_CONTRACT: '/contract',
  PROFIT: '/profit',
};

const CSV = {
  ROOT: `${API_URL}/csv`,
  EXPORT_CASH: '/export-cash',
};

interface GroupCashRouter extends BaseRouter {}

const GROUP_CASH: GroupCashRouter = {
  ROOT: `${API_URL}/group-cash`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
};

const ASSET_TYPE: BaseRouter = {
  ROOT: `${API_URL}/asset-type`,
  CREATE: '/',
  UPDATE: '/:id',
  LIST: '/list',
  RETRIEVE: '/:id',
  DELETE: '/:id',
};

const RouterUrl = {
  USER,
  AUTH,
  CUSTOMER,
  ROLE,
  CASH,
  BAT_HO,
  PAYMENT_HISTORY,
  DEVICE,
  HOST_SERVER,
  LOG_ACTION,
  STATISTICS,
  CSV,
  GROUP_CASH,
  ASSET_TYPE,
  PAWN,
};

export default RouterUrl;
