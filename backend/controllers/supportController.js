import mongoose from "mongoose";
import { Subscriber } from "../models/subscriberModel.js";
import { ContactMessage, CONTACT_TOPICS, MESSAGE_STATUSES } from "../models/contactMessageModel.js";
import { Order } from "../models/orderModel.js";
import { User } from "../models/userModel.js";
import { emailLayout, escapeHtml, sendMail } from "../utils/sendMail.js";
import { clientUrl } from "../config/clientUrl.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// emails are stored as typed, so match them ignoring case
const CASE_INSENSITIVE = { locale: "en", strength: 2 };

const cleanText = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

// Adds the email to the newsletter; resolves to true when it wasn't subscribed yet (and sends the welcome mail)
const addSubscriber = async (email, req) => {
  // upsert, so two quick submits of the same email can't create duplicates
  const result = await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
  if (!result.upsertedCount) return false;
  sendMail({
    to: email,
    subject: "Welcome to Ekart – you're on the list!",
    html: emailLayout({
      title: "Thanks for subscribing!",
      intro: "You'll be the first to hear about new arrivals, exclusive offers and giveaways.",
      button: { href: `${clientUrl(req)}/products`, label: "Start shopping" },
      outro: "Don't want these emails? Turn them off anytime in My Account → Settings.",
    }),
  });
  return true;
};

// Footer newsletter form
export const subscribe = async (req, res) => {
  try {
    const email = cleanText(req.body.email, 254).toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    if (!(await addSubscriber(email, req))) {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: "You're already subscribed. Watch your inbox for our next deals!",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Thanks for subscribing! Check your inbox for a welcome email.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Account settings: newsletter on/off for the signed-in user's email
export const getMyNewsletter = async (req, res) => {
  try {
    const subscribed = Boolean(await Subscriber.exists({ email: req.user.email.toLowerCase() }));
    return res.status(200).json({ success: true, subscribed });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const setMyNewsletter = async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const subscribed = Boolean(req.body.subscribed);
    if (subscribed) await addSubscriber(email, req);
    else await Subscriber.deleteOne({ email });
    return res.status(200).json({
      success: true,
      subscribed,
      message: subscribed ? "You're subscribed to deals & offers" : "You've unsubscribed from newsletter emails",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// "Contact Us" page: stored for the admin panel and forwarded to the store inbox
export const submitContact = async (req, res) => {
  try {
    const name = cleanText(req.body.name, 100);
    const email = cleanText(req.body.email, 254).toLowerCase();
    const phone = cleanText(req.body.phone, 20);
    const orderId = cleanText(req.body.orderId, 40);
    const message = cleanText(req.body.message, 2000);
    const topic = CONTACT_TOPICS.includes(req.body.topic) ? req.body.topic : "Other";

    if (!name) {
      return res.status(400).json({ success: false, message: "Please enter your name" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    if (message.length < 10) {
      return res.status(400).json({ success: false, message: "Please write a message of at least 10 characters" });
    }

    await ContactMessage.create({ name, email, phone, topic, orderId, message });

    sendMail({
      to: process.env.MAIL_USER,
      replyTo: email,
      subject: `[Ekart support] ${topic} – ${name}`,
      html: `<p><b>From:</b> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        ${phone ? `<p><b>Phone:</b> ${escapeHtml(phone)}</p>` : ""}
        ${orderId ? `<p><b>Order:</b> ${escapeHtml(orderId)}</p>` : ""}
        <p><b>Topic:</b> ${escapeHtml(topic)}</p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });

    return res.status(201).json({
      success: true,
      message: "Thanks for reaching out! Our team will reply within 24 hours.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Public order tracking: order ID (full or the short #XXXXXX shown to customers) + the order's email
export const trackOrder = async (req, res) => {
  try {
    const email = cleanText(req.body.email, 254).toLowerCase();
    const ref = cleanText(req.body.orderId, 40).replace(/^#/, "").toLowerCase();
    if (!EMAIL_RE.test(email) || !/^[a-f0-9]{6,24}$/.test(ref)) {
      return res.status(400).json({
        success: false,
        message: "Enter your order ID (like #A1B2C3) and the email used for the order",
      });
    }

    // the order belongs to this email if it's the account email or the shipping email
    const user = await User.findOne({ email }).collation(CASE_INSENSITIVE).select("_id");
    const owners = [{ "shippingAddress.email": email }];
    if (user) owners.push({ user: user._id });

    const orders = await Order.find({ $or: owners })
      .collation(CASE_INSENSITIVE)
      .sort({ createdAt: -1 })
      .populate({ path: "products.productId", select: "productName productImg" });
    const order = orders.find((o) => String(o._id).endsWith(ref));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No order found with that ID for this email. Please check both and try again.",
      });
    }

    const address = order.shippingAddress;
    return res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        amount: order.amount,
        paymentMethod: order.paymentMethod,
        status: order.status,
        orderStatus: order.orderStatus,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
        items: order.products.map(({ productId: product, quantity }) => ({
          productId: product?._id,
          name: product?.productName,
          image: product?.productImg?.[0]?.url,
          quantity,
        })),
        shipTo: address?.city
          ? { fullName: address.fullName, city: address.city, state: address.state, zip: address.zip }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//Admin only

export const getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!MESSAGE_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${MESSAGE_STATUSES.join(", ")}` });
    }
    const contactMessage = mongoose.isValidObjectId(req.params.id) ? await ContactMessage.findById(req.params.id) : null;
    if (!contactMessage) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    contactMessage.status = status;
    await contactMessage.save();
    return res.status(200).json({ success: true, message: `Marked as ${status}`, contactMessage });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteContactMessage = async (req, res) => {
  try {
    const deleted = mongoose.isValidObjectId(req.params.id) ? await ContactMessage.findByIdAndDelete(req.params.id) : null;
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: subscribers.length, subscribers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubscriber = async (req, res) => {
  try {
    const deleted = mongoose.isValidObjectId(req.params.id) ? await Subscriber.findByIdAndDelete(req.params.id) : null;
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Subscriber not found" });
    }
    return res.status(200).json({ success: true, message: "Subscriber removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
