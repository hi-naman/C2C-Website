import { apiClient } from '@/lib/api-client';
import { User } from '@/types';

export interface CompleteProfilePayload {
  phone: string;
  hackerrankUsername: string;
  bio?: string;
}

export const authService = {
  /**
   * Retrieves the quick authenticated user status envelope (token validity check)
   */
  getMe: async (): Promise<Pick<User, 'id' | 'email' | 'name' | 'avatarUrl' | 'role' | 'isProfileComplete'>> => {
    return apiClient<Pick<User, 'id' | 'email' | 'name' | 'avatarUrl' | 'role' | 'isProfileComplete'>>('/api/auth/me');
  },

  /**
   * Fetches the complete profile database record of the logged-in user
   */
  getUserProfile: async (): Promise<User> => {
    return apiClient<User>('/api/users/me');
  },

  /**
   * Updates/completes the user's profile details (phone, hackerrank, bio)
   */
  completeProfile: async (payload: CompleteProfilePayload): Promise<User> => {
    return apiClient<User>('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Updates the user's avatar image URL
   */
  updateAvatar: async (avatarUrl: string): Promise<User> => {
    return apiClient<User>('/api/users/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    });
  },

  /**
   * Clears the HttpOnly auth cookie on the backend
   */
  logout: async (): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  },
};
export default authService;
