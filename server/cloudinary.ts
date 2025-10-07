import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_URL) {
  throw new Error('CLOUDINARY_URL environment variable is required');
}

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

export async function uploadImageToCloudinary(base64Image: string, folder: string = 'makola-connect'): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder,
      resource_type: 'auto',
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

export async function uploadMultipleImagesToCloudinary(base64Images: string[], folder: string = 'makola-connect'): Promise<string[]> {
  try {
    const uploadPromises = base64Images.map(image => uploadImageToCloudinary(image, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images to Cloudinary:', error);
    throw new Error('Failed to upload images');
  }
}

export async function deleteImageFromCloudinary(imageUrl: string): Promise<void> {
  try {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
}

function extractPublicIdFromUrl(url: string): string | null {
  const match = url.match(/\/([^\/]+)\.[a-z]+$/);
  return match ? match[1] : null;
}

export default cloudinary;
