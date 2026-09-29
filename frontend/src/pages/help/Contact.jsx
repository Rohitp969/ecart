import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { CheckCircle2, CircleHelp, Clock, Headset, Loader2, Mail, MapPin, PackageSearch, Phone, Send } from "lucide-react";
import HelpLayout, { HelpCard } from "@/components/HelpLayout";
import { API_URL } from "@/lib/admin";
import { CONTACT_TOPICS, EMAIL_RE, STORE_INFO } from "@/lib/help";

const MAX_MESSAGE = 2000;

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = "Please enter your name";
  if (!EMAIL_RE.test(form.email.trim())) errors.email = "Please enter a valid email address";
  if (form.phone && !/^[\d+\-\s()]{7,20}$/.test(form.phone.trim())) errors.phone = "Please enter a valid phone number";
  if (form.message.trim().length < 10) errors.message = "Please write at least 10 characters";
  return errors;
};

const Field = ({ label, id, error, optional, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
      {label} {optional && <span className="font-normal text-gray-400">(optional)</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const inputClass = (error) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 ${
    error ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-pink-500 focus:ring-pink-100"
  }`;

const Contact = () => {
  const { user } = useSelector((store) => store.user);
  const emptyForm = {
    name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    email: user?.email || "",
    phone: user?.phoneNo || "",
    topic: CONTACT_TOPICS[0],
    orderId: "",
    message: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/api/v1/support/contact`, form);
      setSentMessage(res.data.message);
      toast.success("Message sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const contactCards = [
    { icon: Mail, label: "Email us", value: STORE_INFO.email, href: `mailto:${STORE_INFO.email}` },
    { icon: Phone, label: "Call us", value: STORE_INFO.phone, href: `tel:${STORE_INFO.phone.replace(/[^\d+]/g, "")}` },
    { icon: Clock, label: "Support hours", value: STORE_INFO.hours },
    { icon: MapPin, label: "Head office", value: STORE_INFO.address },
  ];

  return (
    <HelpLayout
      title="Contact Us"
      description="Questions about an order, a product or your account? Send us a message and we'll get back within 24 hours."
      icon={Headset}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <HelpCard>
          {sentMessage ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircle2 className="h-9 w-9" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-gray-900">Message sent!</h2>
              <p className="mt-2 max-w-md text-sm text-gray-600">{sentMessage}</p>
              <p className="mt-1 text-sm text-gray-500">
                We'll reply to <span className="font-medium text-gray-900">{form.email}</span>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm(emptyForm);
                    setSentMessage("");
                  }}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Send another message
                </button>
                <Link to="/products" className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700">
                  Continue shopping
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Send us a message</h2>
                <p className="text-sm text-gray-500">Fields marked optional can be left blank.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" id="name" error={errors.name}>
                  <input id="name" name="name" autoComplete="name" value={form.name} onChange={handleChange} className={inputClass(errors.name)} />
                </Field>
                <Field label="Email" id="email" error={errors.email}>
                  <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} className={inputClass(errors.email)} />
                </Field>
                <Field label="Phone" id="phone" error={errors.phone} optional>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} className={inputClass(errors.phone)} />
                </Field>
                <Field label="Topic" id="topic">
                  <select id="topic" name="topic" value={form.topic} onChange={handleChange} className={`${inputClass()} cursor-pointer`}>
                    {CONTACT_TOPICS.map((topic) => (
                      <option key={topic}>{topic}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Order ID" id="orderId" optional>
                <input id="orderId" name="orderId" placeholder="e.g. #A1B2C3" value={form.orderId} onChange={handleChange} className={inputClass()} />
              </Field>

              <Field label="Message" id="message" error={errors.message}>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  maxLength={MAX_MESSAGE}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help…"
                  className={`${inputClass(errors.message)} resize-y`}
                />
                <p className="mt-1 text-right text-xs text-gray-400">
                  {form.message.length}/{MAX_MESSAGE}
                </p>
              </Field>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </HelpCard>

        <div className="space-y-4">
          <HelpCard title="Other ways to reach us">
            <ul className="space-y-4">
              {contactCards.map((card) => (
                <li key={card.label} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{card.label}</p>
                    {card.href ? (
                      <a href={card.href} className="wrap-break-word text-sm font-medium text-gray-900 hover:text-pink-600">
                        {card.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{card.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </HelpCard>

          <HelpCard title="Quick help">
            <div className="space-y-2">
              <Link to="/track-order" className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-sm font-semibold text-gray-700 hover:border-pink-200 hover:bg-pink-50">
                <PackageSearch className="h-5 w-5 text-pink-600" /> Where is my order?
              </Link>
              <Link to="/faqs" className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-sm font-semibold text-gray-700 hover:border-pink-200 hover:bg-pink-50">
                <CircleHelp className="h-5 w-5 text-pink-600" /> Browse FAQs
              </Link>
            </div>
          </HelpCard>
        </div>
      </div>
    </HelpLayout>
  );
};

export default Contact;
