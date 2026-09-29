import React from "react";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck } from "lucide-react";
import HelpLayout, { HelpCard } from "@/components/HelpLayout";
import { FREE_SHIPPING_ABOVE, RETURN_WINDOW_DAYS, STORE_INFO } from "@/lib/help";

const LAST_UPDATED = "September 2026";

const PRIVACY_SECTIONS = [
  {
    title: "Information we collect",
    points: [
      "Account details: your name, email address and password (stored encrypted).",
      "Profile and delivery details you add: phone number, address, city and PIN code.",
      "Order history: the products you buy, amounts paid and delivery status.",
      "Messages you send us through the Contact Us page, and your email if you subscribe to our newsletter.",
    ],
  },
  {
    title: "How we use it",
    points: [
      "To create your account, process orders and deliver them to you.",
      "To send order updates, password reset codes and replies to your support requests.",
      "To send offers and new arrivals — only if you subscribed to our newsletter.",
      "To keep the store secure and prevent fraud.",
    ],
  },
  {
    title: "Payments",
    points: [
      `All payments are handled by Razorpay. ${STORE_INFO.name} never sees or stores your full card, UPI or bank details.`,
    ],
  },
  {
    title: "Sharing your information",
    points: [
      "We never sell your personal data.",
      "We share only what's needed with delivery partners (to ship your order) and Razorpay (to take payment).",
      "We may disclose information when required by law.",
    ],
  },
  {
    title: "Your choices",
    points: [
      "You can update your profile details and saved addresses anytime from My Account.",
      "Turn newsletter emails off, or permanently delete your account and data, from My Account → Settings.",
    ],
  },
];

const TERMS_SECTIONS = [
  {
    title: "Using our store",
    points: [
      "You must give accurate information when creating an account and are responsible for keeping your password safe.",
      "You agree not to misuse the store, for example by placing fraudulent orders or trying to access other accounts.",
    ],
  },
  {
    title: "Products and prices",
    points: [
      "We try to show product details, images and prices accurately, but mistakes can happen. If an item is priced wrongly, we'll contact you before shipping and you may cancel for a full refund.",
      "Prices are in Indian Rupees (₹). A 5% tax is added at checkout and shown before you pay.",
      "Offers and discounts are valid while stocks last.",
    ],
  },
  {
    title: "Orders and payment",
    points: [
      "Online orders are confirmed once payment succeeds through Razorpay. Cash on Delivery orders are confirmed when placed and paid for when they're delivered.",
      "You can cancel an order from My Orders until it ships.",
      "We may cancel an order if an item is out of stock or the payment looks fraudulent; any amount paid is refunded in full.",
    ],
  },
  {
    title: "Shipping, returns and refunds",
    points: [
      `Shipping is free on orders above ₹${FREE_SHIPPING_ABOVE}. Eligible items can be returned within ${RETURN_WINDOW_DAYS} days of delivery.`,
    ],
    link: { to: "/shipping-returns", label: "Read the full Shipping & Returns policy" },
  },
  {
    title: "Liability",
    points: [
      `${STORE_INFO.name} is not liable for delays caused by events outside our control, such as natural disasters or courier disruptions. Our liability for any order is limited to the amount you paid for it.`,
    ],
  },
  {
    title: "Changes to these terms",
    points: ["We may update these terms from time to time. The date at the top shows when they last changed."],
  },
];

const PolicyPage = ({ title, description, icon, sections }) => (
  <HelpLayout title={title} description={description} icon={icon}>
    <HelpCard>
      <p className="mb-6 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
      <div className="space-y-7">
        {sections.map((section, index) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-gray-900">
              {index + 1}. {section.title}
            </h2>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-gray-600">
              {section.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pink-500" />
                  {point}
                </li>
              ))}
            </ul>
            {section.link && (
              <Link to={section.link.to} className="mt-2 inline-block text-sm font-semibold text-pink-600 hover:underline">
                {section.link.label} →
              </Link>
            )}
          </section>
        ))}
      </div>
      <p className="mt-8 border-t border-gray-100 pt-5 text-sm text-gray-600">
        Questions? Email us at{" "}
        <a href={`mailto:${STORE_INFO.email}`} className="font-semibold text-pink-600 hover:underline">
          {STORE_INFO.email}
        </a>{" "}
        or use the{" "}
        <Link to="/contact" className="font-semibold text-pink-600 hover:underline">
          contact form
        </Link>
        .
      </p>
    </HelpCard>
  </HelpLayout>
);

export const PrivacyPolicy = () => (
  <PolicyPage
    title="Privacy Policy"
    description={`How ${STORE_INFO.name} collects, uses and protects your personal information.`}
    icon={ShieldCheck}
    sections={PRIVACY_SECTIONS}
  />
);

export const TermsOfUse = () => (
  <PolicyPage
    title="Terms of Use"
    description={`The rules for shopping on ${STORE_INFO.name}. Please read them before placing an order.`}
    icon={FileText}
    sections={TERMS_SECTIONS}
  />
);
