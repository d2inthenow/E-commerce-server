import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";

const app = express();
const PORT = process.env.PORT || 8080;

add.use(cors());
app.use(express.json());
app.use(morgan());
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for simplicity, adjust as needed
  })
);

app.get("/", (req, res) => {
  //server to client
  res.json({
    message: "Server is running on port" + process.env.PORT,
  });
});
