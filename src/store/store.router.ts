import { BaseRouter } from "src/common/constant/router";
import { API_URL, BaseRouterUrl } from './../common/constant/router';

export const StoreRouter: BaseRouter = {
    ...BaseRouterUrl,
    ROOT: `${API_URL}/store`
}