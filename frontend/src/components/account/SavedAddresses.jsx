import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import AddressEditor from "@/components/AddressEditor";
import useAddresses from "@/hooks/useAddresses";
import { addressFromProfile, addressLine, addressToForm } from "@/lib/address";

const MAX_ADDRESSES = 10;

const SavedAddresses = () => {
  const { user } = useSelector((store) => store.user);
  const { addresses, loading, saveAddress, removeAddress, makeDefault } = useAddresses();
  const [editor, setEditor] = useState(null); // null = closed, {} = new, { id } = editing
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const editing = editor?.id ? addresses.find((a) => a._id === editor.id) : null;

  const handleSave = async (address, { isDefault }) => {
    if (await saveAddress(address, editor?.id, { isDefault })) setEditor(null);
  };

  const handleDefault = async (id) => {
    setBusyId(id);
    await makeDefault(id);
    setBusyId(null);
  };

  const confirmDelete = async () => {
    setBusyId(toDelete._id);
    await removeAddress(toDelete._id);
    setBusyId(null);
    setToDelete(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
          <p className="text-sm text-gray-500">Your default address is picked automatically at checkout.</p>
        </div>
        {!editor && addresses.length > 0 && (
          <button
            type="button"
            onClick={() => setEditor({})}
            disabled={addresses.length >= MAX_ADDRESSES}
            title={addresses.length >= MAX_ADDRESSES ? `You can save up to ${MAX_ADDRESSES} addresses` : undefined}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add new address
          </button>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {editor && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <AddressEditor
              key={editor.id || "new"}
              initial={editing ? addressToForm(editing) : addressFromProfile(user, addresses.length === 0)}
              title={editing ? "Edit address" : "Add a new address"}
              submitLabel={editing ? "Save changes" : "Save address"}
              onSubmit={handleSave}
              onCancel={() => setEditor(null)}
              showDefaultOption={addresses.length > 0 && !editing?.isDefault}
              defaultChecked={false}
            />
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : addresses.length === 0 ? (
          !editor && (
            <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
              <MapPin className="h-12 w-12 text-gray-300" />
              <p className="mt-3 font-semibold text-gray-900">No saved addresses yet</p>
              <p className="mt-1 text-sm text-gray-500">Save an address to check out faster.</p>
              <button
                type="button"
                onClick={() => setEditor({})}
                className="mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
              >
                <Plus className="h-4 w-4" /> Add address
              </button>
            </div>
          )
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {addresses.map((addr) => (
              <li
                key={addr._id}
                className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                  addr.isDefault ? "border-pink-200 ring-1 ring-pink-200" : "border-gray-100"
                } ${busyId === addr._id ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900">{addr.fullName}</p>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-pink-700">
                      <Star className="h-3 w-3 fill-current" /> Default
                    </span>
                  )}
                </div>
                <p className="mt-1 flex-1 text-sm text-gray-600">{addressLine(addr)}</p>
                <p className="mt-2 text-sm text-gray-500">{addr.phone}</p>
                {addr.email && <p className="text-sm text-gray-500">{addr.email}</p>}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditor({ id: addr._id })}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(addr)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDefault(addr._id)}
                      disabled={busyId === addr._id}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      {busyId === addr._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                      Set as default
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !busyId && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this address?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? `${toDelete.fullName}, ${addressLine(toDelete)}` : ""}
              {toDelete?.isDefault ? " — your next saved address becomes the default." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyId}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={!!busyId}
              className="bg-red-600 hover:bg-red-700"
            >
              {busyId && <Loader2 className="animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SavedAddresses;
