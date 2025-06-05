import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/connectDB.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.options("*", cors()); // Enable pre-flight requests for all routes

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev")); // Log HTTP requests in development mode
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for simplicity, adjust as needed
  })
);

app.get("/", (req, res) => {
  //server to client
  res.json({
    message: "Server is running on port" + PORT,
  });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
