import { API_URL } from 'src/common/constant/router';

interface ContractRouter {
  ROOT: string;
  UPDATE_STATUS: string;
}

export const ContractRouter: ContractRouter = {
  ROOT: `${API_URL}/contract`,
  UPDATE_STATUS: '/update-status',
};
