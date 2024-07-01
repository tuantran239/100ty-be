import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

export const HostServerRouter: BaseRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/host-server`,
};
