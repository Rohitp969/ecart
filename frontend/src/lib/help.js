// Store info + help-center pages, shared by the footer and the help pages
import {
  CircleHelp,
  Facebook,
  FileText,
  Headset,
  Instagram,
  PackageSearch,
  Ruler,
  ShieldCheck,
  Truck,
  Twitter,
  Youtube,
} from "lucide-react";

// Edit these once and they update the footer, contact page and policies
export const STORE_INFO = {
  name: "Ekart",
  tagline: "Your one-stop shop for electronics, fashion, home, beauty and more.",
  address: "123 Electronics St, Style City, NY 10001",
  email: "support@ekart.com",
  phone: "(123) 456-7890",
  hours: "Mon – Sat, 9:00 AM – 9:00 PM",
};

export const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/", icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/", icon: Instagram },
  { label: "Twitter", href: "https://x.com/", icon: Twitter },
  { label: "YouTube", href: "https://www.youtube.com/", icon: Youtube },
];

// Checkout rules (used by AddressForm and the policy pages): free above ₹299, otherwise ₹49; 5% tax
export const FREE_SHIPPING_ABOVE = 299;
export const SHIPPING_FEE = 49;
export const RETURN_WINDOW_DAYS = 30;

export const HELP_PAGES = [
  { to: "/contact", label: "Contact Us", icon: Headset },
  { to: "/faqs", label: "FAQs", icon: CircleHelp },
  { to: "/track-order", label: "Track Order", icon: PackageSearch },
  { to: "/shipping-returns", label: "Shipping & Returns", icon: Truck },
  { to: "/size-guide", label: "Size Guide", icon: Ruler },
  // legal pages sit in the footer's bottom bar instead of the Help column
  { to: "/privacy-policy", label: "Privacy Policy", icon: ShieldCheck, legal: true },
  { to: "/terms", label: "Terms of Use", icon: FileText, legal: true },
];

// keep in sync with CONTACT_TOPICS in backend/models/contactMessageModel.js
export const CONTACT_TOPICS = ["Order issue", "Returns & refunds", "Payment", "Product question", "Account", "Other"];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
