import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

export const UserRouter: BaseRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/users`,
};
