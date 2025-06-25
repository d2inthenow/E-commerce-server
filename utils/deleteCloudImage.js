import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const deleteCloudImage = async (imgUrl) => {
  if (!imgUrl) return null;
  try {
    const parts = imgUrl.split("/");
    const imageName = parts[parts.length - 1].split(".")[0];
    const result = await cloudinary.uploader.destroy(imageName);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error.message);
    return null;
  }
};

export default deleteCloudImage;
