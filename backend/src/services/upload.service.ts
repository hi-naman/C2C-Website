import cloudinary from '../config/cloudinary';
import { env } from '../config/env';

// generate a signature for a direct frontend upload
export const generateUploadSignature = (folder: string) => {
  const timestamp = Math.round(Date.now() / 1000);

  // the parameters that will be signed - must match what the frontend sends
  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    folder,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
  };
};