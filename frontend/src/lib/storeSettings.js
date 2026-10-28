// Store settings from Admin → Store settings (shipping charge, tax, COD, contact details).
// Pages render with these defaults straight away and update once the saved settings arrive.
import { useSyncExternalStore } from "react";
import axios from "axios";
import { STORE_INFO } from "./help";

// same defaults as the backend (backend/models/settingsModel.js)
export const DEFAULT_SETTINGS = {
  supportEmail: "support@ekart.com",
  supportPhone: "(123) 456-7890",
  address: "123 Electronics St, Style City, NY 10001",
  supportHours: "Mon – Sat, 9:00 AM – 9:00 PM",
  shippingFee: 49,
  freeShippingAbove: 299,
  taxRate: 5,
  returnWindowDays: 30,
  codEnabled: true,
};

let current = DEFAULT_SETTINGS;
let requested = false;
const listeners = new Set();

const publish = (settings) => {
  current = { ...DEFAULT_SETTINGS, ...settings };
  listeners.forEach((listener) => listener());
};

// fetch once per page load; a failed request just keeps the defaults
const load = () => {
  if (requested) return;
  requested = true;
  axios
    .get(`${import.meta.env.VITE_API_URL}/api/v1/settings`)
    .then((res) => res.data.success && publish(res.data.settings))
    .catch(() => {});
};

const subscribe = (listener) => {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
};

export const useStoreSettings = () => useSyncExternalStore(subscribe, () => current);

// STORE_INFO plus the contact details from the settings (footer, contact page, policies)
export const useStoreInfo = () => {
  const settings = useStoreSettings();
  return { ...STORE_INFO, address: settings.address, email: settings.supportEmail, phone: settings.supportPhone, hours: settings.supportHours };
};

// after the admin saves the form, so the open tab shows the new values right away
export const setStoreSettings = publish;
