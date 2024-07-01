import { API_URL, BaseRouter, BaseRouterUrl } from 'src/common/constant/router';

export const GroupCashRouter: BaseRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/group-cash`,
};
