import { apiClient } from '@/lib/api-client';
import { User, UserRole } from '@/types';

export const userService = {
  /**
   * Retrieves all registered users in the platform (Admin only)
   */
  getAllUsers: async (): Promise<User[]> => {
    return apiClient<User[]>('/api/users');
  },

  /**
   * Updates a specific user's academic and platform authorization role (Admin only)
   * @param id User ID to update
   * @param role Target UserRole (ADMIN, SENIOR, MEMBER)
   */
  updateUserRole: async (id: string, role: UserRole): Promise<User> => {
    return apiClient<User>(`/api/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};

export default userService;
