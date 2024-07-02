import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

export const RoleRouter: BaseRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/role`,
};
