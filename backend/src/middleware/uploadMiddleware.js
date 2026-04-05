import multer from "multer";
import { assertUploadMimeType } from "../utils/mediaUtils.js";

// Memory storage keeps the first implementation simple because Cloudinary accepts streams directly.
const storage = multer.memoryStorage();

export const mediaUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    try {
      assertUploadMimeType(file.mimetype);
      callback(null, true);
    } catch (error) {
      callback(error);
    }
  },
});
