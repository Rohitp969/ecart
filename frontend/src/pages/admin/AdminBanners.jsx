import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Images, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { btnPrimary, btnSecondary, card, input } from "@/components/admin/ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL, authConfig, loadErrorMessage } from "@/lib/admin";
import ErrorState from "@/components/admin/ErrorState";
import { CATEGORY_GROUPS } from "@/lib/catalog";
import { THEMES } from "@/lib/banners";
import { cn } from "@/lib/utils";

const BANNER_API = `${API_URL}/api/v1/banners`;
const MAX_IMAGE_MB = 5;

const PLACEMENTS = [
  { key: "hero", label: "Hero slider", hint: "The big slides at the top of the home page" },
  { key: "promo", label: "Promo cards", hint: "The smaller cards further down the home page" },
];

// quick links for the "Button link" field
const CATEGORY_LINKS = CATEGORY_GROUPS.flatMap((group) => [
  { label: `All ${group.name}`, link: `/products?category=${group.slug}` },
  ...(group.categories.length > 1 ? group.categories.map((c) => ({ label: `— ${c.name}`, link: `/products?category=${c.slug}` })) : []),
]);

const emptyForm = (placement, position) => ({
  placement,
  title: "",
  eyebrow: "",
  text: "",
  buttonText: "",
  link: "/products",
  theme: Object.keys(THEMES[placement])[0],
  position,
  active: true,
});

// small version of how the banner looks in the store
const BannerPreview = ({ banner, imageUrl, className = "" }) => {
  const theme = (THEMES[banner.placement][banner.theme] || Object.values(THEMES[banner.placement])[0]).className;
  const hero = banner.placement === "hero";
  return (
    <div className={cn("relative flex items-center overflow-hidden rounded-xl bg-gradient-to-r p-4", theme, hero ? "text-white" : "text-gray-900", className)}>
      <div className="relative z-10 min-w-0 max-w-[60%]">
        {hero && banner.eyebrow && <p className="truncate text-[10px] font-semibold uppercase tracking-wider opacity-80">{banner.eyebrow}</p>}
        <p className="line-clamp-2 text-sm font-extrabold leading-snug">{banner.title || "Banner title"}</p>
        <p className="mt-1 text-[11px] font-semibold opacity-80">{banner.buttonText || "Shop now"} →</p>
      </div>
      {imageUrl && (
        <img src={imageUrl} alt="" className={`absolute right-2 h-[85%] w-2/5 object-contain ${hero ? "drop-shadow-xl" : "mix-blend-multiply"}`} />
      )}
    </div>
  );
};

const BannerDialog = ({ banner, onClose, onSaved }) => {
  const editing = Boolean(banner._id);
  const [form, setForm] = useState(() => ({ ...emptyForm(banner.placement, banner.position), ...banner }));
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const changePlacement = (placement) =>
    setForm((prev) => ({ ...prev, placement, theme: THEMES[placement][prev.theme] ? prev.theme : Object.keys(THEMES[placement])[0] }));

  const pickImage = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG or WebP)");
    if (picked.size > MAX_IMAGE_MB * 1024 * 1024) return setError(`Image must be smaller than ${MAX_IMAGE_MB} MB`);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Add a title");
    if (!file && !form.image?.url) return setError("Add a banner image");
    const link = form.link.trim();
    if (link && !link.startsWith("/") && !/^https?:\/\//i.test(link)) return setError('Link must start with "/" (a store page) or "https://"');

    const data = new FormData();
    for (const key of ["placement", "title", "eyebrow", "text", "buttonText", "link", "theme", "position", "active"]) {
      data.append(key, String(form[key] ?? ""));
    }
    if (file) data.append("file", file);
    setSaving(true);
    try {
      const res = editing
        ? await axios.put(`${BANNER_API}/${banner._id}`, data, authConfig())
        : await axios.post(BANNER_API, data, authConfig());
      toast.success(res.data.message);
      onSaved(res.data.banner);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the banner");
    } finally {
      setSaving(false);
    }
  };

  const imageUrl = preview || form.image?.url;
  const hero = form.placement === "hero";

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[95vw] overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle>{editing ? "Edit banner" : "Add banner"}</DialogTitle>
          <DialogDescription>Banners show on the store's home page as soon as they're saved and live.</DialogDescription>
        </DialogHeader>

        <form onSubmit={save} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Where it shows">
            {PLACEMENTS.map((option) => (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={form.placement === option.key}
                onClick={() => changePlacement(option.key)}
                className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                  form.placement === option.key ? "border-pink-500 bg-pink-50/60 ring-1 ring-pink-500" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="block text-sm font-semibold text-gray-900">{option.label}</span>
                <span className="block text-xs text-gray-500">{option.hint}</span>
              </button>
            ))}
          </div>

          <BannerPreview banner={form} imageUrl={imageUrl} className={hero ? "h-36" : "h-28"} />

          <div className="flex flex-wrap items-center gap-3">
            <label className={`${btnSecondary} py-2`}>
              <ImagePlus className="h-4 w-4" /> {imageUrl ? "Change image" : "Upload image"}
              <input type="file" accept="image/*" onChange={pickImage} className="sr-only" />
            </label>
            <span className="text-xs text-gray-500">{file ? file.name : `Product photo on a plain or transparent background works best · up to ${MAX_IMAGE_MB} MB`}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">Title</span>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="e.g. Latest smartphones at the best prices" className={input} />
            </label>
            {hero && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">Small label</span>
                  <input value={form.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} maxLength={40} placeholder="e.g. Mobiles Sale" className={input} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">Button text</span>
                  <input value={form.buttonText} onChange={(e) => set("buttonText", e.target.value)} maxLength={30} placeholder="Shop now" className={input} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">Description</span>
                  <input value={form.text} onChange={(e) => set("text", e.target.value)} maxLength={200} placeholder="One line about the offer" className={input} />
                </label>
              </>
            )}
            {!hero && (
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-gray-700">Button text</span>
                <input value={form.buttonText} onChange={(e) => set("buttonText", e.target.value)} maxLength={30} placeholder="Shop now" className={input} />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">Opens a category</span>
              <select
                value={CATEGORY_LINKS.some((c) => c.link === form.link) ? form.link : ""}
                onChange={(e) => e.target.value && set("link", e.target.value)}
                className={`${input} cursor-pointer`}
              >
                <option value="">Choose a category…</option>
                {CATEGORY_LINKS.map((c) => (
                  <option key={c.link} value={c.link}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">…or any link</span>
              <input value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="/products?category=mobiles" className={input} />
            </label>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-gray-700">Colour</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(THEMES[form.placement]).map(([key, theme]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("theme", key)}
                  aria-pressed={form.theme === key}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${
                    form.theme === key ? "border-pink-500 ring-1 ring-pink-500" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full bg-gradient-to-br ${theme.className}`} />
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-pink-600" />
            Show on the home page
          </label>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save banner" : "Add banner"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Admin → Banners: the home page slider and promo cards
const AdminBanners = () => {
  const [banners, setBanners] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const retry = () => {
    setError("");
    setReloadKey((key) => key + 1);
  };
  const [placement, setPlacement] = useState("hero");
  const [editing, setEditing] = useState(null); // banner being edited, or a new one
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let ignore = false;
    axios
      .get(`${BANNER_API}/all`, authConfig())
      .then((res) => !ignore && setBanners(res.data.banners || []))
      .catch((err) => !ignore && setError(loadErrorMessage(err, "banners")));
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const list = useMemo(
    () => (banners || []).filter((b) => b.placement === placement).sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)),
    [banners, placement],
  );
  const counts = useMemo(
    () => Object.fromEntries(PLACEMENTS.map((p) => [p.key, (banners || []).filter((b) => b.placement === p.key).length])),
    [banners],
  );

  const replace = (saved) => setBanners((prev) => (prev.some((b) => b._id === saved._id) ? prev.map((b) => (b._id === saved._id ? saved : b)) : [...prev, saved]));

  const update = async (banner, fields) => {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.append(key, String(value));
    const res = await axios.put(`${BANNER_API}/${banner._id}`, data, authConfig());
    replace(res.data.banner);
  };

  const toggle = async (banner) => {
    setBusyId(banner._id);
    try {
      await update(banner, { active: !banner.active });
      toast.success(banner.active ? "Banner hidden from the store" : "Banner is live");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the banner");
    } finally {
      setBusyId(null);
    }
  };

  // swap places with the neighbour (positions are renumbered so they stay unique)
  const move = async (index, step) => {
    const other = list[index + step];
    if (!other) return;
    const banner = list[index];
    setBusyId(banner._id);
    try {
      await Promise.all([update(banner, { position: index + step }), update(other, { position: index })]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reorder the banners");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    setBusyId(toDelete._id);
    try {
      const res = await axios.delete(`${BANNER_API}/${toDelete._id}`, authConfig());
      setBanners((prev) => prev.filter((b) => b._id !== toDelete._id));
      toast.success(res.data.message);
      setToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the banner");
    } finally {
      setBusyId(null);
    }
  };

  const tabClass = (active) =>
    `inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
      active ? "bg-white text-pink-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <div>
      <AdminPageHeader title="Banners" description="The slides and promo cards on the store's home page">
        <button onClick={() => setEditing({ placement, position: list.length })} className={btnPrimary}>
          <Plus className="h-4 w-4" /> Add banner
        </button>
      </AdminPageHeader>

      <div className="mb-4 flex w-full rounded-xl bg-gray-100 p-1 sm:inline-flex sm:w-auto">
        {PLACEMENTS.map((option) => (
          <button key={option.key} onClick={() => setPlacement(option.key)} className={tabClass(placement === option.key)}>
            {option.label}
            <span className="rounded-full bg-gray-200 px-1.5 text-xs text-gray-600">{counts[option.key] || 0}</span>
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState title="Couldn't load banners" message={error} onRetry={retry} />
      ) : !banners ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className={`flex flex-col items-center px-6 py-14 text-center ${card}`}>
          <Images className="h-12 w-12 text-gray-300" />
          <p className="mt-3 font-semibold text-gray-900">No {placement === "hero" ? "hero slides" : "promo cards"} yet</p>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            Until you add one, the store shows its built-in {placement === "hero" ? "slides" : "promo cards"}. Add your own to run a sale or promote a
            category.
          </p>
          <button onClick={() => setEditing({ placement, position: 0 })} className={`${btnPrimary} mt-5`}>
            <Plus className="h-4 w-4" /> Add banner
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((banner, index) => (
            <li key={banner._id} className={`overflow-hidden ${card}`}>
              <BannerPreview banner={banner} imageUrl={banner.image?.url} className={`h-36 rounded-none ${banner.active ? "" : "opacity-50"}`} />
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-400">#{index + 1}</span>
                    {banner.active ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">Live</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">Hidden</span>
                    )}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-500" title={banner.link}>
                    Opens {banner.link}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(index, -1)} disabled={index === 0 || busyId === banner._id} title="Move up" aria-label="Move up"
                    className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(index, 1)} disabled={index === list.length - 1 || busyId === banner._id} title="Move down" aria-label="Move down"
                    className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggle(banner)} disabled={busyId === banner._id} title={banner.active ? "Hide" : "Show"} aria-label={banner.active ? "Hide" : "Show"}
                    className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50">
                    {banner.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setEditing(banner)} title="Edit" aria-label="Edit"
                    className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setToDelete(banner)} title="Delete" aria-label="Delete"
                    className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <BannerDialog
          banner={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            replace(saved);
            setPlacement(saved.placement);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this banner?"
        description={`“${toDelete?.title}” will be removed from the home page along with its image. This can't be undone.`}
        confirmLabel="Delete"
        busy={busyId === toDelete?._id}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default AdminBanners;
