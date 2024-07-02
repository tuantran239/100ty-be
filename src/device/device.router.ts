import { BaseRouter, API_URL, BaseRouterUrl } from 'src/common/constant/router';

export const DeviceRouter: BaseRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/device`,
};
