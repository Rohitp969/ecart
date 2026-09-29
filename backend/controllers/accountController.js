import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";
import { Cart } from "../models/cartModel.js";
import { Order } from "../models/orderModel.js";
import { Session } from "../models/sessionModel.js";
import { Subscriber } from "../models/subscriberModel.js";
import cloudinary from "../utils/cloudinary.js";

const MAX_ADDRESSES = 10;
const ADDRESS_FIELDS = ["fullName", "phone", "email", "address", "city", "state", "zip", "country"];

// trimmed known fields + validation; returns { address } or { error }
const readAddress = (body = {}) => {
  const address = {};
  for (const field of ADDRESS_FIELDS) {
    address[field] = typeof body[field] === "string" ? body[field].trim().slice(0, 200) : "";
  }
  address.country = address.country || "India";

  const phoneDigits = address.phone.replace(/\D/g, "");
  const india = address.country.toLowerCase() === "india";
  if (!address.fullName) return { error: "Full name is required" };
  if (phoneDigits.length < 10 || phoneDigits.length > 13) return { error: "Enter a valid 10-digit mobile number" };
  if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address.email)) return { error: "Enter a valid email address" };
  if (!address.address || !address.city || !address.state) return { error: "Address, city and state are required" };
  if (india ? !/^\d{6}$/.test(address.zip) : !/^[A-Za-z0-9\s-]{3,10}$/.test(address.zip)) {
    return { error: india ? "Enter a valid 6-digit PIN code" : "Enter a valid postal code" };
  }
  return { address };
};

// exactly one default while the book isn't empty
const makeDefault = (user, addressId) => {
  user.addresses.forEach((a) => {
    a.isDefault = String(a._id) === String(addressId);
  });
};
const ensureDefault = (user) => {
  if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) user.addresses[0].isDefault = true;
};

export const getAddresses = async (req, res) => {
  return res.status(200).json({ success: true, addresses: req.user.addresses });
};

export const addAddress = async (req, res) => {
  try {
    const user = req.user;
    if (user.addresses.length >= MAX_ADDRESSES) {
      return res.status(400).json({ success: false, message: `You can save up to ${MAX_ADDRESSES} addresses` });
    }
    const { address, error } = readAddress(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    user.addresses.push(address);
    const saved = user.addresses[user.addresses.length - 1];
    if (req.body.isDefault || user.addresses.length === 1) makeDefault(user, saved._id);
    await user.save();
    return res.status(201).json({ success: true, message: "Address saved", address: saved, addresses: user.addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const user = req.user;
    const existing = user.addresses.id(req.params.addressId);
    if (!existing) return res.status(404).json({ success: false, message: "Address not found" });
    const { address, error } = readAddress(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    existing.set(address);
    if (req.body.isDefault) makeDefault(user, existing._id);
    await user.save();
    return res.status(200).json({ success: true, message: "Address updated", address: existing, addresses: user.addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = req.user;
    const existing = user.addresses.id(req.params.addressId);
    if (!existing) return res.status(404).json({ success: false, message: "Address not found" });
    existing.deleteOne();
    ensureDefault(user);
    await user.save();
    return res.status(200).json({ success: true, message: "Address removed", addresses: user.addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const user = req.user;
    if (!user.addresses.id(req.params.addressId)) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    makeDefault(user, req.params.addressId);
    await user.save();
    return res.status(200).json({ success: true, message: "Default address updated", addresses: user.addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Self-service account deletion (Settings). Orders are kept for the store's records.
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.id);
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin accounts can't be deleted here. Ask another admin to change your role first.",
      });
    }
    if (!password || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ success: false, message: "Password is incorrect" });
    }
    const ordersOnTheWay = await Order.countDocuments({
      user: user._id,
      orderStatus: { $in: ["Processing", "Shipped"] },
      $or: [{ status: "Paid" }, { paymentMethod: "COD" }],
    });
    if (ordersOnTheWay) {
      return res.status(400).json({
        success: false,
        message: `You have ${ordersOnTheWay} order${ordersOnTheWay > 1 ? "s" : ""} on the way. Cancel ${
          ordersOnTheWay > 1 ? "them" : "it"
        } or wait for delivery before deleting your account.`,
      });
    }

    if (user.profilePicPublicId) {
      await cloudinary.uploader.destroy(user.profilePicPublicId).catch(() => {});
    }
    await Promise.all([
      Cart.deleteOne({ userId: user._id }),
      Session.deleteMany({ userId: user._id }),
      Subscriber.deleteOne({ email: user.email.toLowerCase() }),
    ]);
    await user.deleteOne();

    return res.status(200).json({ success: true, message: "Your account has been deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
