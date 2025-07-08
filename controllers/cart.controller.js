import UserModel from "../models/user.model.js";
import CartProductModel from "../models/cartproduct.model.js";

// add item to cart
export const addToCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "Provide productId",
        success: false,
        error: true,
      });
    }

    const checkItemCart = await CartProductModel.findOne({
      userId: userId,
      productId: productId,
    });

    if (checkItemCart) {
      return res.status(400).json({
        message: "Item already in cart",
      });
    }

    const cartItem = new CartProductModel({
      userId: userId,
      productId: productId,
      quantity: 1,
    });

    const data = await cartItem.save();

    const updateCartUser = await UserModel.updateOne(
      { _id: userId },
      {
        $push: { shopping_cart: productId },
      }
    );

    return res.status(200).json({
      message: "Item added to cart successfully",
      success: true,
      error: false,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

// get all cart items
export const getCartItems = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }

    const cartItems = await CartProductModel.find({ userId: userId }).populate(
      "productId"
    );

    return res.status(200).json({
      message: "Cart items retrieved successfully",
      success: true,
      error: false,
      data: cartItems,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

//update cart item quantity
export const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.userId;
    const { _id, quantity } = req.body;

    if (!_id || !quantity) {
      return res.status(400).json({
        message: "Provide cartItemId and quantity",
        success: false,
        error: true,
      });
    }

    const updatedCartItem = await CartProductModel.findOneAndUpdate(
      {
        _id: _id,
        userId: userId,
      },
      { quantity: quantity },
      { new: true }
    );

    if (!updatedCartItem) {
      return res.status(404).json({
        message: "Cart item not found",
        success: false,
        error: true,
      });
    }

    return res.status(200).json({
      message: "Cart item updated successfully",
      success: true,
      error: false,
      data: updatedCartItem,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

// delete cart item
export const deleteCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { _id, productId } = req.body;

    if (!_id) {
      return res.status(400).json({
        message: "Provide cartItemId",
        success: false,
        error: true,
      });
    }

    const deletedCartItem = await CartProductModel.findOneAndDelete({
      _id: _id,
      userId: userId,
    });

    if (!deletedCartItem) {
      return res.status(404).json({
        message: "Cart item not found",
        success: false,
        error: true,
      });
    }

    // Remove the product from user's shopping cart
    const user = await UserModel.findOne({
      _id: userId,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }

    user.shopping_cart = user.shopping_cart.filter(
      (item) => item.toString() !== productId.toString()
    );
    await user.save();

    return res.status(200).json({
      message: "Cart item deleted successfully",
      success: true,
      error: false,
      data: deletedCartItem,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};
