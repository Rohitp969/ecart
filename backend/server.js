import "./utils/cloudinary.js";
import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./database/db.js";
import { ALLOWED_ORIGINS } from "./config/clientUrl.js";
import { isMailConfigured } from "./utils/sendMail.js";

import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import cartRoute from "./routes/cartRoute.js";
import orderRoute from "./routes/orderRoute.js";
import supportRoute from "./routes/supportRoute.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "1mb" }));

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

app.get("/api/v1/health", (_req, res) => res.json({ success: true, status: "ok" }));

// Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/support", supportRoute);

// Unknown API route
app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "API route not found" }));

// Last-resort error handler (bad JSON body, unexpected throws) so the client always gets JSON
// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  const status = error.status || error.statusCode || 500;
  if (status >= 500) console.error("❌ Unhandled error:", error);
  res.status(status).json({
    success: false,
    message: error.type === "entity.parse.failed" ? "Invalid JSON in request body" : error.message || "Something went wrong",
  });
});

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server started at http://localhost:${PORT}`);
  if (!isMailConfigured()) {
    console.warn("⚠️  MAIL_USER / MAIL_PASS missing in backend/.env — verification & OTP emails will be printed here instead of sent.");
  }
});
