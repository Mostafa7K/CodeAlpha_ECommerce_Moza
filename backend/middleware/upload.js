import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Uploaded product images are routed through Cloudinary, which converts them
// to webp, caps their dimensions, and applies automatic quality compression
// so we never store large/uncompressed files (Render's filesystem is ephemeral).
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'moza/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    format: 'webp',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto:good' }
    ]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  }
});

export default upload;
