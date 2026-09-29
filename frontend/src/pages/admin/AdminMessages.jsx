import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CheckCircle2, Download, Inbox, Loader2, Mail, MailOpen, Phone, Reply, RotateCcw, Search, Trash2, Users } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatCard from "@/components/admin/StatCard";
import Pagination from "@/components/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
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
import { API_URL, authConfig, formatDate } from "@/lib/admin";
import { CONTACT_TOPICS } from "@/lib/help";

const PAGE_SIZE = 10;
const SUPPORT_API = `${API_URL}/api/v1/support`;

// phones: selects fill the row two-up under the search box; from sm they keep their natural width
const selectClass =
  "min-w-0 grow basis-32 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-pink-500 sm:grow-0 sm:basis-auto";

const StatusPill = ({ status }) =>
  status === "Resolved" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
      <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
      <Mail className="h-3.5 w-3.5" /> New
    </span>
  );

const downloadCsv = (subscribers) => {
  const rows = [["Email", "Subscribed on"], ...subscribers.map((s) => [s.email, new Date(s.createdAt).toISOString()])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `ekart-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const AdminMessages = () => {
  const [view, setView] = useState("inbox");
  const [messages, setMessages] = useState(null);
  const [subscribers, setSubscribers] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [topic, setTopic] = useState("");
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState(null);
  const [toDelete, setToDelete] = useState(null); // { kind: "message" | "subscriber", item }
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([axios.get(`${SUPPORT_API}/messages`, authConfig()), axios.get(`${SUPPORT_API}/subscribers`, authConfig())])
      .then(([messagesRes, subscribersRes]) => {
        if (ignore) return;
        setMessages(messagesRes.data.messages);
        setSubscribers(subscribersRes.data.subscribers);
      })
      .catch((err) => !ignore && setError(err.response?.data?.message || "Could not load messages"));
    return () => {
      ignore = true;
    };
  }, []);

  const summary = useMemo(
    () => ({
      new: (messages || []).filter((m) => m.status === "New").length,
      resolved: (messages || []).filter((m) => m.status === "Resolved").length,
      subscribers: (subscribers || []).length,
    }),
    [messages, subscribers],
  );

  const q = search.trim().toLowerCase();
  const filteredMessages = useMemo(
    () =>
      (messages || []).filter(
        (m) =>
          (!status || m.status === status) &&
          (!topic || m.topic === topic) &&
          (!q || `${m.name} ${m.email} ${m.phone || ""} ${m.orderId || ""} ${m.message}`.toLowerCase().includes(q)),
      ),
    [messages, status, topic, q],
  );
  const filteredSubscribers = useMemo(
    () => (subscribers || []).filter((s) => !q || s.email.includes(q)),
    [subscribers, q],
  );

  const list = view === "inbox" ? filteredMessages : filteredSubscribers;
  const loaded = view === "inbox" ? messages : subscribers;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const setMessageStatus = async (message, nextStatus) => {
    setSavingId(message._id);
    try {
      const res = await axios.put(`${SUPPORT_API}/messages/${message._id}`, { status: nextStatus }, authConfig());
      setMessages((prev) => prev.map((m) => (m._id === message._id ? res.data.contactMessage : m)));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update message");
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    const { kind, item } = toDelete;
    setDeleting(true);
    try {
      const res = await axios.delete(`${SUPPORT_API}/${kind === "message" ? "messages" : "subscribers"}/${item._id}`, authConfig());
      if (kind === "message") setMessages((prev) => prev.filter((m) => m._id !== item._id));
      else setSubscribers((prev) => prev.filter((s) => s._id !== item._id));
      toast.success(res.data.message);
      setToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  const tabClass = (active) =>
    `inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
      active ? "bg-white text-pink-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <div>
      <AdminPageHeader title="Messages" description="Contact form messages and newsletter subscribers from the store">
        {view === "subscribers" && subscribers?.length > 0 && (
          <button
            onClick={() => downloadCsv(filteredSubscribers)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        )}
      </AdminPageHeader>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="New messages" value={summary.new} icon={Inbox} tone="amber" hint="Waiting for a reply" />
        <StatCard label="Resolved" value={summary.resolved} icon={CheckCircle2} tone="green" hint="Marked as done" />
        <StatCard label="Subscribers" value={summary.subscribers} icon={Users} tone="pink" hint="Newsletter sign-ups" />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <div className="flex w-full rounded-xl bg-gray-100 p-1 sm:inline-flex sm:w-auto">
            <button onClick={() => withReset(setView)("inbox")} className={tabClass(view === "inbox")}>
              <Inbox className="h-4 w-4" /> Inbox
              {summary.new > 0 && <span className="rounded-full bg-pink-600 px-1.5 text-xs text-white">{summary.new}</span>}
            </button>
            <button onClick={() => withReset(setView)("subscribers")} className={tabClass(view === "subscribers")}>
              <Users className="h-4 w-4" /> Subscribers
            </button>
          </div>
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => withReset(setSearch)(e.target.value)}
              placeholder={view === "inbox" ? "Search name, email, order ID or message" : "Search email"}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500"
            />
          </div>
          {view === "inbox" && (
            <>
              <select value={status} onChange={(e) => withReset(setStatus)(e.target.value)} className={selectClass} aria-label="Status">
                <option value="">All statuses</option>
                <option value="New">New</option>
                <option value="Resolved">Resolved</option>
              </select>
              <select value={topic} onChange={(e) => withReset(setTopic)(e.target.value)} className={selectClass} aria-label="Topic">
                <option value="">All topics</option>
                {CONTACT_TOPICS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </>
          )}
        </div>

        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : !loaded ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <MailOpen className="h-12 w-12 text-gray-300" />
            <p className="mt-3 font-semibold text-gray-900">
              {loaded.length === 0 ? (view === "inbox" ? "No messages yet" : "No subscribers yet") : "Nothing matches these filters"}
            </p>
          </div>
        ) : view === "inbox" ? (
          <ul className="divide-y divide-gray-100">
            {rows.map((m) => (
              <li key={m._id} className={`p-4 sm:p-5 ${m.status === "New" ? "bg-amber-50/30" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={m.status} />
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{m.topic}</span>
                      {m.orderId && <span className="break-all font-mono text-xs font-semibold text-gray-500">Order {m.orderId}</span>}
                    </div>
                    <p className="mt-2 font-semibold wrap-break-word text-gray-900">{m.name}</p>
                    <p className="flex flex-wrap items-center gap-x-3 text-sm text-gray-500">
                      <a href={`mailto:${m.email}`} className="min-w-0 break-all hover:text-pink-600">{m.email}</a>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:text-pink-600">
                          <Phone className="h-3.5 w-3.5" /> {m.phone}
                        </a>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(m.createdAt, true)}</p>
                </div>

                <p className="mt-3 whitespace-pre-wrap wrap-break-word rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-700">{m.message}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic}${m.orderId ? ` (${m.orderId})` : ""}`)}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-pink-600 px-3 py-2 text-xs font-semibold text-white hover:bg-pink-700 sm:py-1.5"
                  >
                    <Reply className="h-3.5 w-3.5" /> Reply
                  </a>
                  <button
                    onClick={() => setMessageStatus(m, m.status === "New" ? "Resolved" : "New")}
                    disabled={savingId === m._id}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:py-1.5"
                  >
                    {savingId === m._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : m.status === "New" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    {m.status === "New" ? "Mark resolved" : "Reopen"}
                  </button>
                  <button
                    onClick={() => setToDelete({ kind: "message", item: m })}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 sm:py-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="hidden px-3 py-3 font-semibold sm:table-cell">Subscribed on</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a href={`mailto:${s.email}`} className="break-all font-medium text-gray-900 hover:text-pink-600">{s.email}</a>
                      {/* phones: the date column is hidden, show it under the email */}
                      <p className="text-xs text-gray-500 sm:hidden">{formatDate(s.createdAt, true)}</p>
                    </td>
                    <td className="hidden px-3 py-3 text-gray-500 sm:table-cell">{formatDate(s.createdAt, true)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setToDelete({ kind: "subscriber", item: s })}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 sm:py-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-500">
            {list.length
              ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, list.length)} of ${list.length}`
              : view === "inbox" ? "0 messages" : "0 subscribers"}
          </p>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toDelete?.kind === "subscriber" ? "Remove this subscriber?" : "Delete this message?"}</AlertDialogTitle>
            <AlertDialogDescription className="wrap-break-word">
              {toDelete?.kind === "subscriber"
                ? `${toDelete.item.email} will stop receiving newsletter emails.`
                : `The message from ${toDelete?.item.name} will be permanently deleted. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="animate-spin" />} {toDelete?.kind === "subscriber" ? "Remove" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMessages;
