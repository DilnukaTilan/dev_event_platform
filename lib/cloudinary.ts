import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function uploadImage(buffer: Buffer): Promise<UploadApiResponse> {
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
