import { API_URL, BaseRouter } from 'src/common/constant/router';
import { BaseRouterUrl } from 'src/common/constant/router';

export const AssetTypeRouter: BaseRouter = {
  ...BaseRouterUrl,
  ROOT: `${API_URL}/asset-type`,
};
