import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface SignatureResponse {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Request signature from backend, upload file directly to Cloudinary and return secure URL
   */
  const uploadImage = async (file: File, folder: 'forum' | 'avatars'): Promise<string> => {
    setIsUploading(true);
    setError(null);
    try {
      // 1. Fetch Cloudinary signature from our backend API
      const signatureData = await apiClient<SignatureResponse>('/api/uploads/signature', {
        method: 'POST',
        body: JSON.stringify({ folder }),
      });

      // 2. Build FormData for direct Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signatureData.signature);
      formData.append('timestamp', signatureData.timestamp.toString());
      formData.append('folder', signatureData.folder);
      formData.append('api_key', signatureData.apiKey);

      // 3. Post to Cloudinary direct API endpoint
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Cloudinary server rejected the image payload');
      }

      const uploadResult = await response.json();
      return uploadResult.secure_url;
    } catch (err: any) {
      const errMsg = err.message || 'Image upload failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
    error,
  };
}
