// Seeds the catalog with demo products from seed/products.json.
//   npm run seed          -> add/update demo products (safe to run again, no duplicates)
//   npm run seed:remove   -> delete only the demo products (admin-added products are untouched)
// Demo products are recognised by image public_ids starting with "seed/".
import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";

const SEED_FILTER = { "productImg.public_id": { $regex: "^seed/" } };
const remove = process.argv.includes("--remove");

await mongoose.connect(process.env.MONGO_URI);

try {
  if (remove) {
    const { deletedCount } = await Product.deleteMany(SEED_FILTER);
    console.log(`Removed ${deletedCount} demo products`);
  } else {
    const products = JSON.parse(fs.readFileSync(new URL("./products.json", import.meta.url)));
    const admin = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });

    const ops = products.map((p) => ({
      updateOne: {
        filter: { productName: p.productName, ...SEED_FILTER },
        update: { $set: { ...p, userId: admin?._id } },
        upsert: true,
      },
    }));
    const res = await Product.bulkWrite(ops);
    console.log(`Demo products: ${res.upsertedCount} added, ${res.modifiedCount} updated`);
  }
  console.log(`Total products in store: ${await Product.countDocuments()}`);
} finally {
  await mongoose.disconnect();
}
