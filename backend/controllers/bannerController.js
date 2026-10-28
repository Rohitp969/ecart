import mongoose from "mongoose";
import { BANNER_PLACEMENTS, Banner } from "../models/bannerModel.js";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/dataUri.js";

const TEXT_FIELDS = { title: 120, eyebrow: 40, text: 200, buttonText: 30, theme: 20 };

// copy the editable fields from the form; returns an error message or null
const readForm = (body, banner) => {
  for (const [field, max] of Object.entries(TEXT_FIELDS)) {
    if (body[field] !== undefined) banner[field] = String(body[field]).trim().slice(0, max);
  }
  if (body.placement !== undefined) {
    if (!BANNER_PLACEMENTS.includes(body.placement)) return "Choose where the banner shows";
    banner.placement = body.placement;
  }
  if (body.link !== undefined) {
    const link = String(body.link).trim();
    // a page of this store ("/products?category=mobiles") or a full web address
    if (link && !link.startsWith("/") && !/^https?:\/\//i.test(link)) return 'Link must start with "/" or "https://"';
    banner.link = link || "/products";
  }
  if (body.position !== undefined) banner.position = Math.round(Number(body.position) || 0);
  if (body.active !== undefined) banner.active = body.active === true || body.active === "true";
  if (!banner.title) return "Title is required";
  return null;
};

const uploadImage = async (file) => {
  const result = await cloudinary.uploader.upload(getDataUri(file), { folder: "banners" });
  return { url: result.secure_url, public_id: result.public_id };
};

const findBanner = (id) => (mongoose.isValidObjectId(id) ? Banner.findById(id) : null);

// Public: active banners for the home page
export const getActiveBanners = async (_req, res) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ placement: 1, position: 1, createdAt: 1 });
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: every banner, including hidden ones
export const getAllBanners = async (_req, res) => {
  try {
    const banners = await Banner.find().sort({ placement: 1, position: 1, createdAt: 1 });
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBanner = async (req, res) => {
  try {
    const banner = new Banner();
    const problem = readForm(req.body, banner);
    if (problem) return res.status(400).json({ success: false, message: problem });
    if (!req.file) return res.status(400).json({ success: false, message: "Add a banner image" });
    banner.image = await uploadImage(req.file);
    await banner.save();
    res.status(201).json({ success: true, message: "Banner added", banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await findBanner(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
    const problem = readForm(req.body, banner);
    if (problem) return res.status(400).json({ success: false, message: problem });
    if (req.file) {
      const oldImage = banner.image?.public_id;
      banner.image = await uploadImage(req.file);
      if (oldImage) await cloudinary.uploader.destroy(oldImage).catch(() => {});
    }
    await banner.save();
    res.json({ success: true, message: "Banner saved", banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await findBanner(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
    if (banner.image?.public_id) await cloudinary.uploader.destroy(banner.image.public_id).catch(() => {});
    await banner.deleteOne();
    res.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
