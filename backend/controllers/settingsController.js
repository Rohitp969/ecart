import { Settings, getStoreSettings } from "../models/settingsModel.js";

const TEXT_FIELDS = ["supportEmail", "supportPhone", "address", "supportHours"];
const NUMBER_RULES = {
  shippingFee: { min: 0, max: 10000, label: "Shipping charge" },
  freeShippingAbove: { min: 0, max: 1000000, label: "Free delivery limit" },
  taxRate: { min: 0, max: 50, label: "Tax rate" },
  returnWindowDays: { min: 0, max: 365, label: "Return window" },
};

// Public: the store reads these for checkout totals, the footer and the help pages
export const getSettings = async (_req, res) => {
  try {
    res.json({ success: true, settings: await getStoreSettings() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: save the settings form
export const updateSettings = async (req, res) => {
  try {
    const update = {};
    for (const field of TEXT_FIELDS) {
      if (req.body[field] === undefined) continue;
      const value = String(req.body[field]).trim().slice(0, 200);
      if (!value) return res.status(400).json({ success: false, message: "Contact details can't be empty" });
      update[field] = value;
    }
    for (const [field, rule] of Object.entries(NUMBER_RULES)) {
      if (req.body[field] === undefined) continue;
      const value = Number(req.body[field]);
      if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
        return res.status(400).json({ success: false, message: `${rule.label} must be between ${rule.min} and ${rule.max}` });
      }
      update[field] = Math.round(value * 100) / 100;
    }
    if (req.body.codEnabled !== undefined) update.codEnabled = Boolean(req.body.codEnabled);

    await Settings.findOneAndUpdate({ key: "store" }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ success: true, message: "Store settings saved", settings: await getStoreSettings() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
