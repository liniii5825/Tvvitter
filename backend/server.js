import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { v2 as cloudinary } from "cloudinary";

// models
import authRoutes from "./routes/auth.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import postRoutes from "./routes/post.routes.js";
import userRoutes from "./routes/user.routes.js";
import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); // to parse req.body
app.use(express.urlencoded({ extended: true })); // to parse form data(urlencoded)

app.use(cookieParser()); // to parse cookies

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/notification", notificationRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  connectMongoDB();
});
