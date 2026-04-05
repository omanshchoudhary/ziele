import { v2 as cloudinary } from "cloudinary";
import { env, getServiceReadinessSnapshot } from "../config/env.js";

if (getServiceReadinessSnapshot().cloudinary.configured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export { cloudinary };
