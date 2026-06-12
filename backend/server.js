import "./utils/cloudinary.js";
import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./database/db.js";

import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import cartRoute from "./routes/cartRoute.js";
import orderRoute from "./routes/orderRoute.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.use(cors({
  origin: ["http://localhost:5173", "https://ecart-silk-six.vercel.app"],
  credentials: true
}));

// Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/orders", orderRoute);

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server started at http://localhost:${PORT}`);
});

