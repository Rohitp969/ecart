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

// Name and tagline; address, email, phone and hours come from Admin → Store settings (see useStoreInfo)
export const STORE_INFO = {
  name: "Ekart",
  tagline: "Your one-stop shop for electronics, fashion, home, beauty and more.",
};

export const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/", icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/", icon: Instagram },
  { label: "Twitter", href: "https://x.com/", icon: Twitter },
  { label: "YouTube", href: "https://www.youtube.com/", icon: Youtube },
];

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
