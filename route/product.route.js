import { Router } from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";
import {
  uploadImagesProduct,
  createProduct,
  getAllProducts,
  getAllProductsByCatId,
  getAllProductsByCatName,
  getAllProductsBySubCatId,
  getAllProductsBySubCatName,
  getAllProductsByThirdLevelCatId,
  getAllProductsByThirdLevelCatName,
  getAllProductsByPrice,
  getAllProductsByRating,
  getProductQuantity,
  getAllProductsByFeatures,
  deleteProduct,
  getSingleProduct,
  removeImageFromCloudinary,
  updateProduct,
} from "../controllers/product.controller.js";
const productRouter = Router();
productRouter.post(
  "/uploadImages",
  auth,
  upload.array("images"),
  uploadImagesProduct
);
productRouter.post("/create", auth, createProduct);
productRouter.get("/getAllProducts", getAllProducts);
productRouter.get("/getAllProductsByCatId/:id", getAllProductsByCatId);
productRouter.get("/getAllProductsByCatName", getAllProductsByCatName);
productRouter.get("/getAllProductsBySubCatId/:id", getAllProductsBySubCatId);
productRouter.get("/getAllProductsBySubCatName", getAllProductsBySubCatName);
productRouter.get(
  "/getAllProductsByThirdLevelCatId/:id",
  getAllProductsByThirdLevelCatId
);
productRouter.get(
  "/getAllProductsByThirdLevelCatName",
  getAllProductsByThirdLevelCatName
);
productRouter.get("/getAllProductsByPrice", getAllProductsByPrice);
productRouter.get("/getAllProductsByRating", getAllProductsByRating);
productRouter.get("/getProductQuantity", getProductQuantity);
productRouter.get("/getAllProductsByFeatures", getAllProductsByFeatures);
productRouter.get("/:id", getSingleProduct);
productRouter.delete("/:id", deleteProduct);
productRouter.delete("/deleteImage", auth, removeImageFromCloudinary);
productRouter.put("/updateProduct/:id", auth, updateProduct);
export default productRouter;
