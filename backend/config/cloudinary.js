import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Load env variables before using them
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'techconhub',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov', 'pdf', 'webm', 'mkv', 'flv', 'wmv', '3gp', 'zip'],
    resource_type: 'auto',
  },
});

// Separate storage for encrypted media (raw binary files)
export const cloudinaryEncryptedStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'techconhub/encrypted',
    resource_type: 'raw', // Accept any file format as raw
  },
});

export default cloudinary;

