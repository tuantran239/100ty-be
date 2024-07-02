import { API_URL } from 'src/common/constant/router';

interface StatisticsRouter {
  ROOT: string;
  HOME_PREVIEW: string;
  PROFIT: string;
  OVERVIEW: string;
  EXPECTED_RECEIPT: string;
  NEW_HOME_PREVIEW: string;
}

export const StatisticsRouter: StatisticsRouter = {
  ROOT: `${API_URL}/statistics`,
  HOME_PREVIEW: '/home-preview',
  PROFIT: '/profit',
  OVERVIEW: '/overview',
  EXPECTED_RECEIPT: '/expected-receipt',
  NEW_HOME_PREVIEW: '/new-home-preview',
};
