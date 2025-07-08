import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/connectDB.js";
// Import routes
import userRouter from "./route/user.route.js";
import categoryRouter from "./route/category.route.js";
import productRouter from "./route/product.route.js";
import cartRouter from "./route/cart.route.js";
import myListRouter from "./route/mylist.route.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.options("*", cors()); // Enable pre-flight requests for all routes

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev")); // Log HTTP requests in development mode
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Disable cross-origin resource policy
  })
);

app.get("/", (req, res) => {
  //server to client
  res.json({
    message: "Server is running on port" + PORT,
  });
});

//Routes
app.use("/api/user", userRouter);
app.use("/api/category", categoryRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/mylist", myListRouter);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
