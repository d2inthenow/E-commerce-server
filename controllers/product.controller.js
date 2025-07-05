import ProductModel from "../models/products.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload images for product
export const uploadImagesProduct = async (req, res) => {
  try {
    imagesArr = [];

    const image = req.files;

    const uploadOptions = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };
    for (let i = 0; i < image?.length; i++) {
      const uploadResult = await cloudinary.uploader.upload(
        image[i].path,
        uploadOptions,
        function (error, result) {
          imagesArr.push(result.secure_url);
          // Xóa file ảnh local sau khi upload
          fs.unlinkSync(`uploads/${req.files[i].filename}`);
        }
      );
    }

    return res.status(200).json({
      message: "Images uploaded successfully",
      images: imagesArr,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: true,
    });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    let product = new ProductModel({
      name: req.body.name,
      description: req.body.description,
      images: req.body.images,
      brand: req.body.brand,
      price: req.body.price,
      oldPrice: req.body.oldPrice,
      catName: req.body.catName,
      catId: req.body.catId,
      subCatId: req.body.subCatId,
      subCatName: req.body.subCatName,
      thirdCatId: req.body.thirdCatId,
      thirdCatName: req.body.thirdCatName,
      countInStock: req.body.countInStock,
      discount: req.body.discount,
      rating: req.body.rating,
      productRam: req.body.productRam,
      size: req.body.size,
      productWeight: req.body.productWeight,
      isFeatured: req.body.isFeatured,
    });

    product = await product.save();

    if (!product) {
      return res.status(400).json({
        message: "Product creation failed",
        error: true,
        success: false,
      });
    }

    return res.status(201).json({
      message: "Product created successfully",
      data: product,
      error: false,
      success: true,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      message: "Something went wrong while creating product",
      error: error.message,
      success: false,
    });
  }
};

//Get all products
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage);
    const totalProducts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    if (page > totalPages) {
      return res.status(400).json({
        message: "Page number exceeds total pages",
        error: true,
        success: false,
      });
    }

    const products = await ProductModel.find()
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      return res.status(404).json({
        message: "No products found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      error: false,
      success: true,
      page: page,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching products",
      error: error.message,
      success: false,
    });
  }
};

// Get product by category ID
export const getAllProductsByCatId = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1000;
    const totalProducts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    if (page > totalPages) {
      return res.status(400).json({
        message: "Page number exceeds total pages",
        error: true,
        success: false,
      });
    }

    const products = await ProductModel.find({
      catId: req.params.id,
    })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      return res.status(404).json({
        message: "No products found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      error: false,
      success: true,
      page: page,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching products",
      error: error.message,
      success: false,
    });
  }
};

// Get product by category name
export const getAllProductsByCatName = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1000;
    const totalProducts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    if (page > totalPages) {
      return res.status(400).json({
        message: "Page number exceeds total pages",
        error: true,
        success: false,
      });
    }

    const products = await ProductModel.find({
      catName: req.query.catName,
    })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      return res.status(404).json({
        message: "No products found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      error: false,
      success: true,
      page: page,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching products",
      error: error.message,
      success: false,
    });
  }
};

// Get product by subcategory ID
export const getAllProductsBySubCatId = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1000;
    const totalProducts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    if (page > totalPages) {
      return res.status(400).json({
        message: "Page number exceeds total pages",
        error: true,
        success: false,
      });
    }

    const products = await ProductModel.find({
      subCatId: req.params.id,
    })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      return res.status(404).json({
        message: "No products found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      error: false,
      success: true,
      page: page,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching products",
      error: error.message,
      success: false,
    });
  }
};

// Get product by subcategory name
export const getAllProductsBySubCatName = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1000;
    const totalProducts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    if (page > totalPages) {
      return res.status(400).json({
        message: "Page number exceeds total pages",
        error: true,
        success: false,
      });
    }

    const products = await ProductModel.find({
      subCatName: req.query.subCatName,
    })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      return res.status(404).json({
        message: "No products found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      error: false,
      success: true,
      page: page,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching products",
      error: error.message,
      success: false,
    });
  }
};

// Get product by third category ID
export const getAllProductsByThirdLevelCatId = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1000;
    const totalProducts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    if (page > totalPages) {
      return res.status(400).json({
        message: "Page number exceeds total pages",
        error: true,
        success: false,
      });
    }

    const products = await ProductModel.find({
      thirdCatId: req.params.id,
    })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      return res.status(404).json({
        message: "No products found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      error: false,
      success: true,
      page: page,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching products",
      error: error.message,
      success: false,
    });
  }
};

// Get product by third category name
export const getAllProductsByThirdLevelCatName = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1000;
    const totalProducts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    if (page > totalPages) {
      return res.status(400).json({
        message: "Page number exceeds total pages",
        error: true,
        success: false,
      });
    }

    const products = await ProductModel.find({
      thirdCatName: req.query.thirdCatName,
    })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      return res.status(404).json({
        message: "No products found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      error: false,
      success: true,
      page: page,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching products",
      error: error.message,
      success: false,
    });
  }
};

//get product by price
export const getAllProductsByPrice = async (req, res) => {
  try {
    let productList = [];

    if (req.query.catId !== "" && req.query.catId !== undefined) {
      const productListArr = await ProductModel.find({
        catId: req.query.catId,
      }).populate("category");
      productList = productListArr;
    }

    if (req.query.subCatId !== "" && req.query.subCatId !== undefined) {
      const productListArr = await ProductModel.find({
        subCatId: req.query.subCatId,
      }).populate("category");
      productList = productListArr;
    }

    if (req.query.thirdCatId !== "" && req.query.thirdCatId !== undefined) {
      const productListArr = await ProductModel.find({
        thirdCatId: req.query.thirdCatId,
      }).populate("category");
      productList = productListArr;
    }

    const filteredProducts = productList.filter((product) => {
      if (req.query.minPrice && product.price < parseInt(+req.query.minPrice)) {
        return false;
      }
      if (req.query.minPrice && product.price > parseInt(+req.query.maxPrice)) {
        return false;
      }
      return true;
    });
    return res.status(200).json({
      message: "Products fetched successfully",
      data: filteredProducts,
      error: false,
      success: true,
      totalPages: 0,
      page: 0,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching products by price",
      error: error.message,
      success: false,
    });
  }
};

//get product by rating
export const getAllProductsByRating = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1000;

    const totalProducts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    if (page > totalPages) {
      return res.status(400).json({
        message: "Page number exceeds total pages",
        error: true,
        success: false,
      });
    }

    const query = {};

    // Ép kiểu để đảm bảo đúng
    if (req.query.rating !== undefined) {
      query.rating = req.query.rating;
    }

    if (req.query.catId !== undefined) {
      query.catId = req.query.catId;
    }

    if (req.query.subCatId !== undefined) {
      query.subCatId = req.query.subCatId;
    }

    if (req.query.thirdCatId !== undefined) {
      query.thirdCatId = req.query.thirdCatId;
    }

    const products = await ProductModel.find(query)
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    if (!products || products.length === 0) {
      return res.status(200).json({
        message: "No products found with the specified rating",
        data: [],
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      error: false,
      success: true,
      page: page,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching products",
      error: error.message,
      success: false,
    });
  }
};

//get product quantity
export const getProductQuantity = async (req, res) => {
  try {
    const productsCount = await ProductModel.countDocuments();

    if (!productsCount) {
      return res.status(404).json({
        message: "No products found",
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      message: "Product quantity fetched successfully",
      data: productsCount,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching product quantity",
      error: error.message,
      success: false,
    });
  }
};

//get all featured products
export const getAllProductsByFeatures = async (req, res) => {
  try {
    const products = await ProductModel.find({
      isFeatured: true,
    }).populate("category");

    if (!products) {
      return res.status(404).json({
        message: "No products found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching products",
      error: error.message,
      success: false,
    });
  }
};

// get single product
export const getSingleProduct = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id).populate(
      "category"
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      data: product,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching product",
      error: error.message,
      success: false,
    });
  }
};

//delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id).populate(
      "category"
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        error: true,
        success: false,
      });
    }

    const images = product.images;
    let img = "";
    for (img of images) {
      const urlArr = img.split("/");
      const image = urlArr[urlArr.length - 1];
      const imageName = image.split(".")[0];

      if (imageName) {
        cloudinary.uploader.destroy(imageName, function (error, result) {});
      }
    }

    const deletedProduct = await ProductModel.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(400).json({
        message: "Product deletion failed",
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while deleting product",
      error: error.message,
      success: false,
    });
  }
};

//delete image from Cloudinary
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

//updated product
export const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        images: req.body.images,
        brand: req.body.brand,
        price: req.body.price,
        oldPrice: req.body.oldPrice,
        catName: req.body.catName,
        catId: req.body.catId,
        subCatId: req.body.subCatId,
        subCatName: req.body.subCatName,
        thirdCatId: req.body.thirdCatId || "",
        thirdCatName: req.body.thirdCatName || "",
        countInStock: req.body.countInStock,
        discount: req.body.discount,
        rating: req.body.rating,
        productRam: req.body.productRam || [],
        size: req.body.size || [],
        productWeight: req.body.productWeight || [],
        isFeatured:
          req.body.isFeatured !== undefined ? req.body.isFeatured : false,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found",
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      data: updatedProduct,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while updating product",
      error: error.message,
      success: false,
    });
  }
};
