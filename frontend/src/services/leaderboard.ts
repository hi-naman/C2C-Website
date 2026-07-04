import { apiClient } from '@/lib/api-client';
import { User, UserRole } from '@/types';

export interface LeaderboardRank {
  rank: number;
  userId: string;
  totalScore: number;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    year: number;
    hackerrankUsername: string | null;
    role: UserRole;
  };
}

export interface SyncLeaderboardResponse {
  totalFetched: number;
  matched: number;
  unmatchedCount: number;
  unmatched: string[];
}

export const leaderboardService = {
  /**
   * Fetches the ranked leaderboard for a specific student year (1, 2, 3, or 4)
   */
  getLeaderboard: async (year: number): Promise<LeaderboardRank[]> => {
    return apiClient<LeaderboardRank[]>(`/api/leaderboard?year=${year}`);
  },

  /**
   * Syncs leaderboard entries from pasted HackerRank JSON (admin only)
   */
  syncLeaderboard: async (
    contestId: string,
    leaderboardJson: any
  ): Promise<SyncLeaderboardResponse> => {
    return apiClient<SyncLeaderboardResponse>(`/api/sync/contest/${contestId}`, {
      method: 'POST',
      body: JSON.stringify(leaderboardJson),
    });
  },
};
export default leaderboardService;
