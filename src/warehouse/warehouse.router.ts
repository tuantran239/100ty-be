import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

export const WarehouseRouter: BaseRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/warehouse`,
};
