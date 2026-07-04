import { apiClient } from '@/lib/api-client';
import { Camp, YearTarget, Registration } from '@/types';

export interface CampApiResponse extends Camp {
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  _count?: {
    registrations: number;
  };
}

export const campService = {
  /**
   * Fetches the full camps catalog, filtered optionally by Year target
   */
  getAllCamps: async (yearTarget?: YearTarget): Promise<CampApiResponse[]> => {
    const url = yearTarget ? `/api/camps?yearTarget=${yearTarget}` : '/api/camps';
    return apiClient<CampApiResponse[]>(url);
  },

  /**
   * Fetches an individual camp details by ID
   */
  getCampById: async (id: string): Promise<CampApiResponse> => {
    return apiClient<CampApiResponse>(`/api/camps/${id}`);
  },

  /**
   * Creates a new camp
   */
  createCamp: async (data: any): Promise<CampApiResponse> => {
    return apiClient<CampApiResponse>('/api/camps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing camp
   */
  updateCamp: async (id: string, data: any): Promise<CampApiResponse> => {
    return apiClient<CampApiResponse>(`/api/camps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a camp
   */
  deleteCamp: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/api/camps/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Registers for a camp
   */
  registerForCamp: async (campId: string): Promise<Registration> => {
    return apiClient<Registration>(`/api/registrations/camp/${campId}`, {
      method: 'POST',
    });
  },

  /**
   * Fetches registrations for a specific camp (Admin only)
   */
  getCampRegistrations: async (campId: string): Promise<any[]> => {
    return apiClient<any[]>(`/api/camps/${campId}/registrations`);
  },

  /**
   * Fetches all registrations of the current logged-in user
   */
  getMyRegistrations: async (): Promise<Registration[]> => {
    return apiClient<Registration[]>('/api/registrations/my');
  },
};
export default campService;
