// Delivery address helpers, shared by checkout and the account's address book
// (the backend validates the same way in controllers/accountController.js)

export const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "India",
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isIndia = (country = "") => country.trim().toLowerCase() === "india";

// form values for a saved address (every field as a string)
export const addressToForm = (address = {}) =>
  Object.fromEntries(Object.keys(EMPTY_ADDRESS).map((key) => [key, String(address[key] ?? EMPTY_ADDRESS[key])]));

// First address: the whole profile. Later ones: just the contact details.
export const addressFromProfile = (user, withAddress) => ({
  ...EMPTY_ADDRESS,
  fullName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
  phone: user?.phoneNo || "",
  email: user?.email || "",
  ...(withAddress ? { address: user?.address || "", city: user?.city || "", zip: user?.zipCode || "" } : {}),
});

export const validateAddress = (data) => {
  const errors = {};
  const phoneDigits = data.phone.replace(/\D/g, "");

  if (!data.fullName.trim()) errors.fullName = "Full name is required.";
  if (!data.phone.trim()) errors.phone = "Phone number is required.";
  else if (phoneDigits.length < 10 || phoneDigits.length > 13) errors.phone = "Enter a valid 10-digit mobile number.";
  if (!data.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(data.email.trim())) errors.email = "Enter a valid email address.";
  if (!data.address.trim()) errors.address = "Address is required.";
  if (!data.city.trim()) errors.city = "City is required.";
  if (!data.state.trim()) errors.state = "State is required.";
  if (!data.country.trim()) errors.country = "Country is required.";
  if (!data.zip.trim()) errors.zip = "PIN code is required.";
  else if (isIndia(data.country) ? !/^\d{6}$/.test(data.zip.trim()) : !/^[A-Za-z0-9\s-]{3,10}$/.test(data.zip.trim())) {
    errors.zip = isIndia(data.country) ? "Enter a valid 6-digit PIN code." : "Enter a valid postal code.";
  }
  return errors;
};

export const cleanAddress = (data) => Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.trim()]));

export const addressLine = (a) => `${a.address}, ${a.city}, ${a.state} – ${a.zip}${a.country ? `, ${a.country}` : ""}`;
