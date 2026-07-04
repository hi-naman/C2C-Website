import { apiClient } from '@/lib/api-client';
import { Hackathon, HackathonTeam } from '@/types';

export const hackathonService = {
  /**
   * Retrieves the hackathons catalog
   */
  getAllHackathons: async (): Promise<Hackathon[]> => {
    return apiClient<Hackathon[]>('/api/hackathons');
  },

  /**
   * Retrieves detail profiles for a hackathon
   * Content changes dynamically based on session role (Public vs Member vs Admin)
   */
  getHackathonById: async (id: string): Promise<Hackathon> => {
    return apiClient<Hackathon>(`/api/hackathons/${id}`);
  },

  /**
   * Registers the authenticated user for a hackathon
   */
  register: async (hackathonId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/api/registrations/hackathon/${hackathonId}`, {
      method: 'POST',
    });
  },

  /**
   * Creates a new squad for a hackathon
   */
  createTeam: async (hackathonId: string, teamName: string): Promise<HackathonTeam> => {
    return apiClient<HackathonTeam>(`/api/hackathons/${hackathonId}/teams`, {
      method: 'POST',
      body: JSON.stringify({ teamName }),
    });
  },

  /**
   * Joins an existing squad via 6-digit code
   */
  joinTeam: async (hackathonId: string, joinCode: string): Promise<{ teamId: string }> => {
    return apiClient<{ teamId: string }>(`/api/hackathons/${hackathonId}/teams/join`, {
      method: 'POST',
      body: JSON.stringify({ joinCode }),
    });
  },

  /**
   * Creates a new hackathon
   */
  createHackathon: async (data: any): Promise<Hackathon> => {
    return apiClient<Hackathon>('/api/hackathons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates a hackathon
   */
  updateHackathon: async (id: string, data: any): Promise<Hackathon> => {
    return apiClient<Hackathon>(`/api/hackathons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a hackathon
   */
  deleteHackathon: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/api/hackathons/${id}`, {
      method: 'DELETE',
    });
  },
};
export default hackathonService;
