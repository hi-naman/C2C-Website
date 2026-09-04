import { apiClient } from '@/lib/api-client';
import { ForumPost, ForumComment } from '@/types';

export const forumService = {
  /**
   * Retrieves all forum posts, optionally filtered by tag
   */
  getAllPosts: async (tag?: string): Promise<ForumPost[]> => {
    const url = tag ? `/api/forum?tag=${encodeURIComponent(tag)}` : '/api/forum';
    return apiClient<ForumPost[]>(url);
  },

  /**
   * Retrieves a single post by ID along with its comment thread
   */
  getPostById: async (id: string): Promise<ForumPost> => {
    return apiClient<ForumPost>(`/api/forum/${id}`);
  },

  /**
   * Creates a new forum post
   */
  createPost: async (payload: {
    title: string;
    content: string;
    tags: string[];
    imageUrls: string[];
  }): Promise<ForumPost> => {
    return apiClient<ForumPost>('/api/forum', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Updates an existing forum post (title, content, tags, imageUrls)
   */
  updatePost: async (
    id: string,
    payload: Partial<{ title: string; content: string; tags: string[]; imageUrls: string[] }>
  ): Promise<ForumPost> => {
    return apiClient<ForumPost>(`/api/forum/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Deletes a forum post (soft delete on the backend)
   */
  deletePost: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/api/forum/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggles an upvote on a post. Returns { upvoted: boolean }
   */
  toggleUpvote: async (id: string): Promise<{ upvoted: boolean }> => {
    return apiClient<{ upvoted: boolean }>(`/api/forum/${id}/upvote`, {
      method: 'POST',
    });
  },

  /**
   * Toggles pinned status on a post (Admin only)
   */
  togglePinPost: async (id: string): Promise<ForumPost> => {
    return apiClient<ForumPost>(`/api/forum/${id}/pin`, {
      method: 'POST',
    });
  },

  /**
   * Adds a new comment (or nested reply) to a post
   */
  createComment: async (
    postId: string,
    content: string,
    parentId?: string
  ): Promise<ForumComment> => {
    return apiClient<ForumComment>(`/api/forum/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  },

  /**
   * Updates a comment
   */
  updateComment: async (commentId: string, content: string): Promise<ForumComment> => {
    return apiClient<ForumComment>(`/api/forum/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Deletes a comment
   */
  deleteComment: async (commentId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/api/forum/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};
export default forumService;
