import { apiClient } from '@/lib/api-client';
import { Session, YearTarget } from '@/types';

export interface SessionApiResponse extends Session {
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export const sessionService = {
  /**
   * Fetches the full sessions catalog, filtered optionally by Year target
   */
  getAllSessions: async (yearTarget?: YearTarget): Promise<SessionApiResponse[]> => {
    const url = yearTarget ? `/api/sessions?yearTarget=${yearTarget}` : '/api/sessions';
    return apiClient<SessionApiResponse[]>(url);
  },

  /**
   * Fetches an individual session details by ID
   */
  getSessionById: async (id: string): Promise<SessionApiResponse> => {
    return apiClient<SessionApiResponse>(`/api/sessions/${id}`);
  },

  /**
   * Creates a new session
   */
  createSession: async (data: any): Promise<SessionApiResponse> => {
    return apiClient<SessionApiResponse>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing session
   */
  updateSession: async (id: string, data: any): Promise<SessionApiResponse> => {
    return apiClient<SessionApiResponse>(`/api/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a session
   */
  deleteSession: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/api/sessions/${id}`, {
      method: 'DELETE',
    });
  },
};
export default sessionService;
