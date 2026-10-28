import mongoose from "mongoose";
import { COUPON_TYPES, Coupon } from "../models/couponModel.js";
import { Cart } from "../models/cartModel.js";
import { CouponError, evaluateCoupon } from "../utils/pricing.js";

// optional number field: "" / null clears it
const optionalNumber = (value) => (value === "" || value === null || value === undefined ? undefined : Number(value));

// copy the form into the coupon; returns an error message or null
const readForm = (body, coupon) => {
  if (body.code !== undefined) {
    const code = String(body.code).trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return "Code must be 3–20 letters or numbers (no spaces)";
    coupon.code = code;
  }
  if (body.description !== undefined) coupon.description = String(body.description).trim().slice(0, 120);
  if (body.type !== undefined) {
    if (!COUPON_TYPES.includes(body.type)) return "Choose percent or flat discount";
    coupon.type = body.type;
  }
  if (body.value !== undefined) coupon.value = Number(body.value);
  if (!(coupon.value > 0)) return "Discount must be more than 0";
  if (coupon.type === "percent" && coupon.value > 90) return "Percent discount can be at most 90%";

  const minOrder = optionalNumber(body.minOrder);
  if (body.minOrder !== undefined) coupon.minOrder = minOrder && minOrder > 0 ? minOrder : 0;
  if (body.maxDiscount !== undefined) {
    const maxDiscount = optionalNumber(body.maxDiscount);
    coupon.maxDiscount = maxDiscount > 0 ? maxDiscount : undefined;
  }
  if (body.usageLimit !== undefined) {
    const usageLimit = optionalNumber(body.usageLimit);
    coupon.usageLimit = usageLimit > 0 ? Math.floor(usageLimit) : undefined;
  }
  if (body.expiresAt !== undefined) {
    if (!body.expiresAt) coupon.expiresAt = undefined;
    else {
      // a date from the form means "valid until the end of that day"
      const date = new Date(`${String(body.expiresAt).slice(0, 10)}T23:59:59`);
      if (Number.isNaN(date.getTime())) return "Enter a valid expiry date";
      coupon.expiresAt = date;
    }
  }
  if (body.active !== undefined) coupon.active = Boolean(body.active);
  return null;
};

const findCoupon = (id) => (mongoose.isValidObjectId(id) ? Coupon.findById(id) : null);
const duplicateCode = (error) => error?.code === 11000;

// Admin
export const getCoupons = async (_req, res) => {
  try {
    res.json({ success: true, coupons: await Coupon.find().sort({ createdAt: -1 }) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon();
    const problem = readForm(req.body, coupon);
    if (problem) return res.status(400).json({ success: false, message: problem });
    if (!coupon.code) return res.status(400).json({ success: false, message: "Enter a coupon code" });
    await coupon.save();
    res.status(201).json({ success: true, message: `Coupon ${coupon.code} created`, coupon });
  } catch (error) {
    if (duplicateCode(error)) return res.status(400).json({ success: false, message: "A coupon with this code already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await findCoupon(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    const problem = readForm(req.body, coupon);
    if (problem) return res.status(400).json({ success: false, message: problem });
    await coupon.save();
    res.json({ success: true, message: `Coupon ${coupon.code} saved`, coupon });
  } catch (error) {
    if (duplicateCode(error)) return res.status(400).json({ success: false, message: "A coupon with this code already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await findCoupon(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    await coupon.deleteOne();
    res.json({ success: true, message: `Coupon ${coupon.code} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Customer: check a code against the current cart before placing the order
export const applyCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId", "productPrice");
    const subtotal = (cart?.items || [])
      .filter((item) => item.productId)
      .reduce((sum, item) => sum + item.productId.productPrice * item.quantity, 0);
    if (!subtotal) return res.status(400).json({ success: false, message: "Your cart is empty" });
    const { coupon, discount } = await evaluateCoupon(req.body.code, subtotal);
    res.json({
      success: true,
      message: `${coupon.code} applied`,
      coupon: { code: coupon.code, description: coupon.description, discount },
    });
  } catch (error) {
    if (error instanceof CouponError) return res.status(400).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
