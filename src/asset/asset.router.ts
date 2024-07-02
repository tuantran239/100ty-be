import { API_URL, BaseRouter } from 'src/common/constant/router';
import { BaseRouterUrl } from 'src/common/constant/router';

export const AssetRouter: BaseRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/asset`,
};
