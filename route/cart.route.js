import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  addToCartItem,
  getCartItems,
  updateCartItemQuantity,
  deleteCartItem,
} from "../controllers/cart.controller.js";

const cartRouter = Router();

cartRouter.post("/create", auth, addToCartItem);
cartRouter.get("/get", auth, getCartItems);
cartRouter.put("/update", auth, updateCartItemQuantity);
cartRouter.delete("/delete", auth, deleteCartItem);

export default cartRouter;
