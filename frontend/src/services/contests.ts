import { apiClient } from '@/lib/api-client';
import { Contest, YearTarget } from '@/types';

export interface ContestApiResponse extends Contest {
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  isLocked: boolean;
}

export const contestService = {
  /**
   * Fetches the full contests catalog, filtered optionally by Year target
   */
  getAllContests: async (yearTarget?: YearTarget): Promise<ContestApiResponse[]> => {
    const url = yearTarget ? `/api/contests?yearTarget=${yearTarget}` : '/api/contests';
    return apiClient<ContestApiResponse[]>(url);
  },

  /**
   * Fetches an individual contest details by ID
   */
  getContestById: async (id: string): Promise<ContestApiResponse> => {
    return apiClient<ContestApiResponse>(`/api/contests/${id}`);
  },

  /**
   * Submits an access code to unlock a gated contest's link
   * @returns The raw hackerrankUrl link
   */
  unlockContest: async (id: string, code: string): Promise<{ hackerrankUrl: string }> => {
    return apiClient<{ hackerrankUrl: string }>(`/api/contests/${id}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  /**
   * Creates a new contest
   */
  createContest: async (data: any): Promise<ContestApiResponse> => {
    return apiClient<ContestApiResponse>('/api/contests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing contest
   */
  updateContest: async (id: string, data: any): Promise<ContestApiResponse> => {
    return apiClient<ContestApiResponse>(`/api/contests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a contest
   */
  deleteContest: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/api/contests/${id}`, {
      method: 'DELETE',
    });
  },
};
export default contestService;
