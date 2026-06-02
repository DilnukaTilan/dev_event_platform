import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
  });
}

function assertCloudinaryConfig() {
  const hasUrlConfig = Boolean(process.env.CLOUDINARY_URL);
  const hasSplitConfig = Boolean(
    cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret,
  );

  if (!hasUrlConfig && !hasSplitConfig) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
}

export function uploadImage(buffer: Buffer): Promise<UploadApiResponse> {
  assertCloudinaryConfig();

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: "image", folder: "DevEvent" },
        (error, result) => {
          if (error) return reject(error);
          if (!result)
            return reject(new Error("Cloudinary returned an empty result"));
          resolve(result);
        },
      )
      .end(buffer);
  });
}

export default cloudinary;
