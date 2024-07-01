import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

export const LogActionRouter: BaseRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/log-action`,
};
