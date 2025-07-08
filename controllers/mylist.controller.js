import MyListModel from "../models/myList.model.js";

// add item to my list
export const addToMyListItem = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      productId,
      productTitle,
      image,
      rating,
      price,
      oldPrice,
      brand,
      discount,
    } = req.body;

    const checkItemMyList = await MyListModel.findOne({
      userId: userId,
      productId: productId,
    });

    if (checkItemMyList) {
      return res.status(400).json({
        message: "Item already in my list",
      });
    }

    const myListItem = new MyListModel({
      userId,
      productId,
      productTitle,
      image,
      rating,
      price,
      oldPrice,
      brand,
      discount,
      userId,
    });

    const data = await myListItem.save();

    return res.status(200).json({
      message: "Item added to my list successfully",
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

// get all items in my list
export const getMyListItems = async (req, res) => {
  try {
    const userId = req.userId;

    const myListItems = await MyListModel.find({ userId: userId });

    return res.status(200).json({
      message: "My list items fetched successfully",
      success: true,
      error: false,
      data: myListItems.length > 0 ? myListItems : "No items in my list",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

// delete item from my list
export const deleteMyListItem = async (req, res) => {
  try {
    const myListItem = await MyListModel.findById(req.params.id);
    if (!myListItem) {
      return res.status(404).json({
        message: "Item not found in my list",
        success: false,
        error: true,
      });
    }

    const deletedItem = await MyListModel.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(400).json({
        message: "Failed to delete item from my list",
        success: false,
        error: true,
      });
    }

    return res.status(200).json({
      message: "Item deleted from my list successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};
