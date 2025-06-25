import CategoryModel from "../models/category.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import deleteCloudImage from "../utils/deleteCloudImage.js";

// Configuration cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

//image upload
export const uploadImagesCategory = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "No image uploaded", error: true });
    }

    // ===== Upload ảnh mới lên Cloudinary =====
    const uploadOptions = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    const uploadResult = await cloudinary.uploader.upload(
      files[0].path,
      uploadOptions
    );

    // Xóa file ảnh local sau khi upload
    try {
      fs.unlinkSync(files[0].path);
      console.log(`Deleted local file: ${files[0].path}`);
    } catch (err) {
      console.error(`Failed to delete local file: ${err.message}`);
    }

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      images: [uploadResult.secure_url],
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: true,
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const images = req.files;
    const { name, parentCatName, parentId } = req.body;

    if (!name || !images || images.length === 0) {
      return res.status(400).json({
        message: "Please provide category name and image",
        error: true,
        success: false,
      });
    }

    // Upload ảnh lên Cloudinary
    const uploadOptions = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    const uploadResult = await cloudinary.uploader.upload(
      images[0].path,
      uploadOptions
    );

    // Xoá file local
    try {
      fs.unlinkSync(images[0].path);
      console.log(`Deleted local file: ${images[0].path}`);
    } catch (err) {
      console.error(`Failed to delete local file: ${err.message}`);
    }

    // Tạo category mới
    const category = new CategoryModel({
      name,
      images: [uploadResult.secure_url],
      parentCatName,
      parentId,
    });

    await category.save();

    return res.status(201).json({
      message: "Category created successfully",
      category,
      error: false,
      success: true,
    });
  } catch (error) {
    console.error("Category creation error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: true,
    });
  }
};

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    const categoryMap = {};
    if (!categories || categories.length === 0) {
      return res.status(404).json({
        message: "No categories found",
        error: true,
      });
    }

    // Map categories to a more structured format
    categories.forEach((cat) => {
      categoryMap[cat._id] = { ...cat._doc, children: [] };
    });

    const rootCategories = [];
    // Build the hierarchy
    categories.forEach((cat) => {
      if (cat.parentId) {
        categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
      } else {
        // If it has no parent, it's a root category
        rootCategories.push(categoryMap[cat._id]);
      }
    });

    return res.status(200).json({
      message: "Categories fetched successfully",
      data: rootCategories,
      error: false,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: true,
    });
  }
};

// get category count
export const getCategoriesCount = async (req, res) => {
  try {
    const categoryCount = await CategoryModel.countDocuments({
      parentId: null,
    });

    if (!categoryCount) {
      return res.status(404).json({
        message: "No categories found",
        error: true,
        success: false,
      });
    } else {
      return res.send({
        categoryCount: categoryCount,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: true,
      success: false,
    });
  }
};

// get sub category count
export const getSubCategoriesCount = async (req, res) => {
  try {
    const subCategoryCount = await CategoryModel.countDocuments({
      parentId: { $ne: null },
    });

    return res.json({
      subCategoryCount,
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: true,
      success: false,
    });
  }
};

// get single category
export const getSingleCategory = async (req, res) => {
  try {
    const category = await CategoryModel.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      message: "Category fetched successfully",
      data: category,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: true,
      success: false,
    });
  }
};

//delete image
export const removeImageFromCloudinary = async (req, res) => {
  const imgUrl = req.query.img;
  const urlArr = imgUrl.split("/");
  const image = urlArr[urlArr.length - 1];
  const imageName = image.split(".")[0];

  if (imageName) {
    const result = await cloudinary.uploader.destroy(
      imageName,
      (error, result) => {
        if (error) {
          console.error("Cloudinary deletion error:", error);
        }
      }
    );

    if (result.result === "ok") {
      return res.status(200).json({
        message: "Image removed successfully",
      });
    } else {
      return res.status(500).json({
        message: "Failed to remove image",
      });
    }
  } else {
    return res.status(400).json({
      message: "Invalid image URL",
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Đệ quy xoá toàn bộ category con và ảnh Cloudinary
    const deleteCategoryRecursively = async (id) => {
      const category = await CategoryModel.findById(id);
      if (!category) return;

      // Xoá tất cả ảnh trong category này
      for (const img of category.images) {
        await deleteCloudImage(img);
      }

      // Tìm tất cả subcategories
      const subCategories = await CategoryModel.find({ parentId: id });

      // Gọi đệ quy để xoá từng subcategory
      for (const sub of subCategories) {
        await deleteCategoryRecursively(sub._id);
      }

      // Xoá chính category hiện tại
      await CategoryModel.findByIdAndDelete(id);
    };

    // Bắt đầu xoá từ category gốc được truyền vào
    await deleteCategoryRecursively(categoryId);

    return res.status(200).json({
      message: "Category and its subcategories deleted successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      message: "Something went wrong while deleting category",
      error: true,
      success: false,
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { name, images, parentCatName, parentId } = req.body;
    const categoryId = req.params.id;

    // Không cho làm cha của chính mình
    if (parentId && parentId === categoryId) {
      return res.status(400).json({
        message: "A category cannot be its own parent",
        error: true,
        success: false,
      });
    }

    // Build fields to update
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (images !== undefined) updateFields.images = images;
    if (parentCatName !== undefined) updateFields.parentCatName = parentCatName;
    if (parentId !== undefined) updateFields.parentId = parentId;

    const category = await CategoryModel.findByIdAndUpdate(
      categoryId,
      updateFields,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      data: category,
      error: false,
      success: true,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      message: "Something went wrong while updating category",
      error: true,
      success: false,
    });
  }
};
