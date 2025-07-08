import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  addToMyListItem,
  deleteMyListItem,
  getMyListItems,
} from "../controllers/mylist.controller.js";

const myListRouter = Router();

myListRouter.post("/create", auth, addToMyListItem);
myListRouter.delete("/:id", auth, deleteMyListItem);
myListRouter.get("/", auth, getMyListItems);

export default myListRouter;
