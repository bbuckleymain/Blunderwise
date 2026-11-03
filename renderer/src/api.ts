import type { CoachApi } from '../../shared/api';

declare global {
  interface Window {
    coachApi: CoachApi;
  }
}

export const api = (): CoachApi => window.coachApi;
