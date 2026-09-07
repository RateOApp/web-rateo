import { api } from '@/lib/api/client';
import type { ParticipationOf, ParticipationOwnStatus } from '@/types/participation';

export const participationService = {
  /** The signed-in user's own participation state. */
  async status(): Promise<ParticipationOwnStatus> {
    const { data } = await api.get<ParticipationOwnStatus>('/participation/status');
    return data;
  },

  /** Another user's or company's score and history. */
  async of(userId: string): Promise<ParticipationOf> {
    const { data } = await api.get<ParticipationOf>(
      `/participation/${encodeURIComponent(userId)}`,
    );
    return data;
  },
};
