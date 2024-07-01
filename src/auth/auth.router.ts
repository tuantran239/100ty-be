import { API_URL } from 'src/common/constant/router';

export const AuthRouter = {
  ROOT: `${API_URL}/auth`,
  ME: '/me',
  LOGIN: '/signin',
  REGISTER: '/signup',
  LOGOUT: 'logout',
};
