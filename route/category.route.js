import { Router } from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";
import {
  uploadImagesCategory,
  createCategory,
  getAllCategories,
  getCategoriesCount,
  getSubCategoriesCount,
  getSingleCategory,
  removeImageFromCloudinary,
  deleteCategory,
  updateCategory,
} from "../controllers/category.controller.js";

const categoryRouter = Router();

categoryRouter.post(
  "/uploadImages",
  auth,
  upload.array("images"),
  uploadImagesCategory
);
categoryRouter.post("/create", auth, upload.array("images"), createCategory);
categoryRouter.get("/", auth, getAllCategories);
categoryRouter.get("/get/count", auth, getCategoriesCount);
categoryRouter.get("/get/count/subCat", auth, getSubCategoriesCount);
categoryRouter.get("/:id", auth, getSingleCategory);
categoryRouter.delete("/deleteImage", auth, removeImageFromCloudinary);
categoryRouter.delete("/:id", auth, deleteCategory);
categoryRouter.put("/:id", auth, upload.array("images"), updateCategory);

export default categoryRouter;
