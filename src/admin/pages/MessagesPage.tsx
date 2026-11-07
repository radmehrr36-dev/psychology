import { useState } from "react";
import { Eye, MailWarning, MessageSquarePlus, Plus } from "lucide-react";
import { friendlyError, supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useList } from "../hooks";
import {
  AccessDenied,
  Button,
  Card,
  DataTable,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  Pagination,
  StatusBadge,
  formatDate,
  inputClass,
  toFa,
  useToast,
  type Column,
} from "../ui";
import type { SupportMessage, SupportReply } from "../../lib/types";

const CATEGORIES = [
  { value: "general", label: "عمومی" },
  { value: "technical", label: "فنی" },
  { value: "account", label: "حساب کاربری" },
  { value: "test", label: "آزمون" },
  { value: "billing", label: "پرداخت" },
  { value: "content", label: "محتوا" },
];

const categoryLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

export function MessagesPage() {
  const { can } = useAuth();
  const { notify } = useToast();
  const canRead = can("support", "read");
  const canWrite = can("support", "write");

  const list = useList<SupportMessage>({
    table: "support_messages",
    select: "*",
    searchColumn: "subject",
    orderBy: "created_at",
    pageSize: 10,
    enabled: canRead,
  });

  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [manual, setManual] = useState({
    subject: "",
    body: "",
    requester_name: "",
    requester_email: "",
    category: "general",
    priority: "normal",
  });

  const openMessage = async (message: SupportMessage) => {
    setSelected(message);
    setNoteDraft(message.internal_note ?? "");
    setReplyBody("");
    setIsInternal(false);
    if (!supabase) return;
    setRepliesLoading(true);
    const { data, error } = await supabase
      .from("support_replies")
      .select("id,message_id,author_email,body,is_internal,delivery_status,created_at")
      .eq("message_id", message.id)
      .order("created_at", { ascending: true });
    setRepliesLoading(false);
    if (error) {
      notify(friendlyError(error), "error");
      return;
    }
    setReplies((data ?? []) as SupportReply[]);
  };

  const updateMessage = async (message: SupportMessage, patch: Partial<SupportMessage>) => {
    if (!supabase) return;
    setBusy("update");
    const { error } = await supabase.from("support_messages").update(patch).eq("id", message.id);
    setBusy(null);
    if (error) {
      notify(friendlyError(error), "error");
      return;
    }
    const next = { ...message, ...patch };
    setSelected(next);
    notify("وضعیت پیام به‌روزرسانی شد.");
    list.refresh();
  };

  const submitReply = async () => {
    if (!supabase || !selected) return;
    if (replyBody.trim().length < 2) {
      notify("متن پاسخ را وارد کنید.", "error");
      return;
    }
    setBusy("reply");
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("support_replies").insert({
        message_id: selected.id,
        author_id: auth.user?.id ?? null,
        author_email: auth.user?.email ?? null,
        body: replyBody.trim(),
        is_internal: isInternal,
        delivery_status: "not_sent",
      });
      if (error) throw error;
      const updatePayload: Record<string, unknown> = { last_reply_at: new Date().toISOString() };
      if (!isInternal) updatePayload.status = "in_progress";
      const { error: updateError } = await supabase.from("support_messages").update(updatePayload).eq("id", selected.id);
      if (updateError) throw updateError;
      notify(
        isInternal
          ? "یادداشت داخلی ثبت شد."
          : "پاسخ در پایگاه داده ثبت شد؛ کانال ارسال ایمیل پیکربندی نشده، بنابراین برای کاربر ارسال نشد."
      );
      setReplyBody("");
      await openMessage(selected);
      list.refresh();
    } catch (e) {
      notify(friendlyError(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const saveInternalNote = async () => {
    if (!supabase || !selected) return;
    setBusy("note");
    const { error } = await supabase.from("support_messages").update({ internal_note: noteDraft || null }).eq("id", selected.id);
    setBusy(null);
    if (error) {
      notify(friendlyError(error), "error");
      return;
    }
    notify("یادداشت داخلی پیام ذخیره شد.");
    setSelected({ ...selected, internal_note: noteDraft || null });
    list.refresh();
  };

  const createManual = async () => {
    if (!supabase) return;
    if (manual.subject.trim().length < 3 || manual.body.trim().length < 5) {
      notify("موضوع و متن پیام را کامل وارد کنید.", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manual.requester_email.trim())) {
      notify("ایمیل درخواست‌دهنده معتبر نیست.", "error");
      return;
    }
    setBusy("create");
    const { error } = await supabase.from("support_messages").insert({
      subject: manual.subject.trim(),
      body: manual.body.trim(),
      requester_name: manual.requester_name.trim() || null,
      requester_email: manual.requester_email.trim(),
      category: manual.category,
      priority: manual.priority,
      status: "new",
    });
    setBusy(null);
    if (error) {
      notify(friendlyError(error), "error");
      return;
    }
    notify("پیام برای پیگیری ثبت شد.");
    setCreateOpen(false);
    setManual({ subject: "", body: "", requester_name: "", requester_email: "", category: "general", priority: "normal" });
    list.refresh();
  };

  const assignToMe = async () => {
    if (!supabase || !selected) return;
    const { data } = await supabase.auth.getUser();
    await updateMessage(selected, { assigned_to: data.user?.id ?? null, status: "in_progress" });
  };

  const columns: Column<SupportMessage>[] = [
    {
      key: "subject",
      header: "موضوع",
      render: (m) => (
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-bold text-ink">{m.subject}</p>
          <p dir="ltr" className="truncate text-left text-[10.5px] text-body">{m.requester_email}</p>
        </div>
      ),
    },
    { key: "category", header: "دسته", render: (m) => <span className="text-[11.5px] text-body">{categoryLabel(m.category)}</span> },
    { key: "status", header: "وضعیت", render: (m) => <StatusBadge status={m.status} /> },
    { key: "priority", header: "اولویت", render: (m) => <StatusBadge status={m.priority} /> },
    { key: "created", header: "ثبت", render: (m) => <span className="whitespace-nowrap text-[11px] text-body">{formatDate(m.created_at)}</span> },
  ];

  if (!canRead) return <AccessDenied />;

  return (
    <>
      <PageHeader
        title="پیام‌های پشتیبانی"
        description="پیام‌های ثبت‌شده از فرم عمومی یا ورودی دستی کارکنان. اطلاعات تماس فقط برای نقش‌های دارای مجوز پشتیبانی قابل مشاهده است."
        breadcrumb={["پنل مدیریت", "پشتیبانی"]}
        actions={
          canWrite ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              ثبت پیام دستی
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#e5c98f] bg-[#fdf6e8] px-3.5 py-2.5 text-[11.5px] leading-6 text-[#8a641f]">
        <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
        کانال ارسال ایمیل پیکربندی نشده است. پاسخ‌های ثبت‌شده با وضعیت «ارسال‌نشده» ذخیره می‌شوند و نباید به‌عنوان
        پاسخ ارسال‌شده به کاربر تلقی شوند.
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-ink/8 p-3">
          <input type="search" value={list.search} onChange={(e) => list.setSearch(e.target.value)} placeholder="جست‌وجوی موضوع…" className={`${inputClass} max-w-xs`} aria-label="جست‌وجوی پیام" />
          <select value={list.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)} className={`${inputClass} max-w-[10rem]`} aria-label="فیلتر وضعیت پیام">
            <option value="">وضعیت: همه</option>
            <option value="new">جدید</option>
            <option value="in_progress">در حال بررسی</option>
            <option value="answered">پاسخ داده‌شده</option>
            <option value="closed">بسته</option>
          </select>
          <select value={list.filters.priority ?? ""} onChange={(e) => list.setFilter("priority", e.target.value)} className={`${inputClass} max-w-[9rem]`} aria-label="فیلتر اولویت">
            <option value="">اولویت: همه</option>
            <option value="urgent">فوری</option>
            <option value="high">بالا</option>
            <option value="normal">عادی</option>
            <option value="low">پایین</option>
          </select>
          <span className="ms-auto text-[11.5px] text-body">{toFa(list.total)} پیام</span>
        </div>

        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          error={list.error}
          onRetry={list.refresh}
          emptyTitle="پیامی ثبت نشده است"
          emptyDescription="پیام‌های ارسال‌شده از فرم عمومی یا ثبت دستی اینجا نمایش داده می‌شوند."
          rowActions={(m) => (
            <button type="button" onClick={() => void openMessage(m)} className="flex min-h-9 items-center gap-1.5 rounded-md px-2 text-[11.5px] font-bold text-steel hover:bg-steel/10">
              <Eye className="h-3.5 w-3.5" />
              جزئیات و پاسخ
            </button>
          )}
        />
        {!list.loading && !list.error && list.total > 0 && (
          <Pagination page={list.page} pageSize={10} total={list.total} onPage={list.setPage} />
        )}
      </Card>

      {selected && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto bg-ink/30 p-4 py-8" onClick={() => setSelected(null)}>
          <div role="dialog" aria-modal="true" aria-label="جزئیات پیام پشتیبانی" className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-[15px] font-extrabold text-ink">{selected.subject}</h2>
                <p className="mt-0.5 text-[11.5px] text-body">
                  {selected.requester_name || "بدون نام"} · <span dir="ltr">{selected.requester_email}</span> · {formatDate(selected.created_at, true)}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setSelected(null)}>بستن</Button>
            </div>

            <p className="mb-4 whitespace-pre-line rounded-lg bg-[#f8fafc] p-3.5 text-[12.5px] leading-7 text-ink">{selected.body}</p>

            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              <Field label="وضعیت">
                <select className={inputClass} value={selected.status} disabled={!canWrite || busy === "update"} onChange={(e) => void updateMessage(selected, { status: e.target.value as SupportMessage["status"] })}>
                  <option value="new">جدید</option>
                  <option value="in_progress">در حال بررسی</option>
                  <option value="answered">پاسخ داده‌شده</option>
                  <option value="closed">بسته</option>
                </select>
              </Field>
              <Field label="اولویت">
                <select className={inputClass} value={selected.priority} disabled={!canWrite || busy === "update"} onChange={(e) => void updateMessage(selected, { priority: e.target.value as SupportMessage["priority"] })}>
                  <option value="low">پایین</option>
                  <option value="normal">عادی</option>
                  <option value="high">بالا</option>
                  <option value="urgent">فوری</option>
                </select>
              </Field>
              <div className="flex flex-col justify-center gap-2">
                <span className="text-[11px] text-body">مسئول رسیدگی</span>
                <Button size="sm" variant="secondary" onClick={() => void assignToMe()} disabled={!canWrite}>
                  {selected.assigned_to ? "به من واگذار مجدد" : "واگذاری به من"}
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-[12.5px] font-extrabold text-ink">
                <MessageSquarePlus className="h-4 w-4 text-steel" />
                تاریخچه‌ی مکاتبات و یادداشت‌ها
              </h3>
              {repliesLoading ? (
                <LoadingState label="دریافت پاسخ‌ها…" />
              ) : replies.length === 0 ? (
                <p className="rounded-lg bg-[#f8fafc] p-3 text-[11.5px] text-body">پاسخی ثبت نشده است.</p>
              ) : (
                <ul className="max-h-56 space-y-2 overflow-y-auto">
                  {replies.map((r) => (
                    <li key={r.id} className={`rounded-lg p-3 ${r.is_internal ? "bg-[#fdf6e8]" : "bg-[#f8fafc]"} border border-ink/8`}>
                      <p className="whitespace-pre-line text-[12px] leading-6 text-ink">{r.body}</p>
                      <p className="mt-1 text-[10px] text-body">
                        {r.is_internal ? "یادداشت داخلی" : "پاسخ"} · {r.author_email ?? "—"} · {formatDate(r.created_at, true)} ·{" "}
                        {r.delivery_status === "not_sent" ? "ارسال‌نشده (ایمیل پیکربندی نشده)" : r.delivery_status}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canWrite && (
              <div className="space-y-3">
                <Field label="پاسخ / یادداشت جدید" hint="پاسخ‌های غیرداخلی در پایگاه داده ثبت می‌شوند اما تا پیکربندی سرویس ایمیل به کاربر ارسال نمی‌شوند.">
                  <textarea rows={3} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} className={`${inputClass} leading-6`} />
                </Field>
                <label className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                  <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="h-4 w-4 accent-[#3d5f92]" />
                  این متن یادداشت داخلی است (برای کاربر قابل مشاهده نیست)
                </label>
                <div className="flex justify-end">
                  <Button onClick={() => void submitReply()} loading={busy === "reply"}>ثبت پاسخ</Button>
                </div>

                <Field label="یادداشت داخلی پیام">
                  <textarea rows={2} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} className={`${inputClass} leading-6`} />
                </Field>
                <div className="flex justify-end">
                  <Button variant="secondary" size="sm" onClick={() => void saveInternalNote()} loading={busy === "note"}>ذخیره‌ی یادداشت</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto bg-ink/30 p-4 py-8" onClick={() => busy !== "create" && setCreateOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="ثبت پیام دستی" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-1 text-[15px] font-extrabold text-ink">ثبت پیام پشتیبانی</h2>
            <p className="mb-4 text-[11.5px] leading-6 text-body">برای درخواست‌های تلفنی یا حضوری که کارمند پشتیبانی ثبت می‌کند.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="موضوع" required>
                  <input value={manual.subject} onChange={(e) => setManual({ ...manual, subject: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <Field label="نام درخواست‌دهنده">
                <input value={manual.requester_name} onChange={(e) => setManual({ ...manual, requester_name: e.target.value })} className={inputClass} />
              </Field>
              <Field label="ایمیل" required>
                <input type="email" dir="ltr" value={manual.requester_email} onChange={(e) => setManual({ ...manual, requester_email: e.target.value })} className={`${inputClass} text-left`} />
              </Field>
              <Field label="دسته">
                <select value={manual.category} onChange={(e) => setManual({ ...manual, category: e.target.value })} className={inputClass}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="اولویت">
                <select value={manual.priority} onChange={(e) => setManual({ ...manual, priority: e.target.value })} className={inputClass}>
                  <option value="low">پایین</option>
                  <option value="normal">عادی</option>
                  <option value="high">بالا</option>
                  <option value="urgent">فوری</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="متن پیام" required>
                  <textarea rows={4} value={manual.body} onChange={(e) => setManual({ ...manual, body: e.target.value })} className={`${inputClass} leading-6`} />
                </Field>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={busy === "create"}>انصراف</Button>
              <Button onClick={() => void createManual()} loading={busy === "create"}>ثبت پیام</Button>
            </div>
          </div>
        </div>
      )}
      {list.error && <div className="sr-only"><ErrorState message={list.error} /></div>}
    </>
  );
}
