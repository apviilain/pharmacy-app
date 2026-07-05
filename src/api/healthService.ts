import { localHealthTips } from './localUiData';

export interface HealthTip {
  _id: string;
  title: string;
  description: string;
  [key: string]: unknown;
}

export const healthService = {
  getHealthTips: async (): Promise<HealthTip[]> =>
    localHealthTips.map(item => ({ ...item })),
};
