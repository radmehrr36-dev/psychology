import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  Inbox,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TestTube2,
  Users,
} from "lucide-react";
import { friendlyError, supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { formatDate, ErrorState, PageHeader, Button, Card, StatusBadge, toFa } from "../ui";
import type { AuditLog, ServiceSetting } from "../../lib/types";

interface Stats {
  usersTotal: number | null;
  usersNew: number | null;
  testsPublished: number | null;
  contentPublished: number | null;
  supportOpen: number | null;
}

const emptyStats: Stats = { usersTotal: null, usersNew: null, testsPublished: null, contentPublished: null, supportOpen: null };

export function DashboardPage() {
  const { can, profile } = useAuth();
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [services, setServices] = useState<ServiceSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const since = new Date(Date.now() - range * 86400000).toISOString();
    try {
      const next: Stats = { ...emptyStats };

      const tasks: Array<Promise<void>> = [];

      if (can("users", "read")) {
        tasks.push(
          (async () => {
            const [{ count: total }, { count: recent }] = await Promise.all([
              supabase!.from("profiles").select("id", { count: "exact", head: true }),
              supabase!.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
            ]);
            next.usersTotal = total ?? 0;
            next.usersNew = recent ?? 0;
          })()
        );
      }

      if (can("tests", "read")) {
        tasks.push(
          (async () => {
            const { count } = await supabase!.from("tests").select("id", { count: "exact", head: true }).eq("status", "published");
            next.testsPublished = count ?? 0;
          })()
        );
      }

      if (can("content", "read")) {
        tasks.push(
          (async () => {
            const tables = ["pages", "articles", "magazines", "books"] as const;
            const results = await Promise.all(
              tables.map((t) => supabase!.from(t).select("id", { count: "exact", head: true }).eq("status", "published"))
            );
            next.contentPublished = results.reduce((sum, r) => sum + (r.count ?? 0), 0);
          })()
        );
      }

      if (can("support", "read")) {
        tasks.push(
          (async () => {
            const { count } = await supabase!.from("support_messages").select("id", { count: "exact", head: true }).in("status", ["new", "in_progress"]);
            next.supportOpen = count ?? 0;
          })()
        );
      }

      if (can("audit", "read")) {
        tasks.push(
          (async () => {
            const { data, error: err } = await supabase!
              .from("audit_logs")
              .select("id,actor_email,actor_role,action,resource_type,resource_id,result,metadata,created_at,actor_id")
              .order("created_at", { ascending: false })
              .limit(8);
            if (err) throw err;
            setActivity((data ?? []) as AuditLog[]);
          })()
        );
      }

      if (can("settings", "api")) {
        tasks.push(
          (async () => {
            const { data } = await supabase!.from("service_settings").select("*").order("name");
            setServices((data ?? []) as ServiceSetting[]);
          })()
        );
      }

      await Promise.all(tasks);
      setStats(next);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [can, range]);

  useEffect(() => {
    void load();
  }, [load, nonce]);

  const cards = [
    {
      key: "users",
      title: "کاربران ثبت‌نام‌شده",
      value: stats.usersTotal,
      sub: stats.usersNew !== null ? `${toFa(stats.usersNew)} کاربر جدید در ${toFa(range)} روز اخیر` : "بدون مجوز مشاهده",
      icon: Users,
      to: can("users", "read") ? "/admin/users" : null,
      tone: "bg-steel/10 text-steel",
    },
    {
      key: "tests",
      title: "آزمون‌های منتشرشده",
      value: stats.testsPublished,
      sub: stats.testsPublished === 0 ? "هنوز آزمونی منتشر نشده است" : "فقط آزمون‌های با بازبینی تأییدشده",
      icon: TestTube2,
      to: can("tests", "read") ? "/admin/tests" : null,
      tone: "bg-[#e9f0f8] text-steel",
    },
    {
      key: "content",
      title: "محتوای منتشرشده",
      value: stats.contentPublished,
      sub: "صفحه، مقاله، مجله و کتاب",
      icon: FileText,
      to: can("content", "read") ? "/admin/articles" : null,
      tone: "bg-[#f1edfa] text-[#6a5fc0]",
    },
    {
      key: "support",
      title: "پیام‌های در انتظار پاسخ",
      value: stats.supportOpen,
      sub: stats.supportOpen === 0 ? "همه‌ی پیام‌ها بررسی شده‌اند" : "وضعیت جدید یا در حال بررسی",
      icon: Inbox,
      to: can("support", "read") ? "/admin/messages" : null,
      tone: "bg-[#fdf1df] text-[#9a6a24]",
    },
  ].filter((c) => c.value !== null);

  return (
    <>
      <PageHeader
        title={`سلام${profile?.full_name ? `، ${profile.full_name}` : ""}`}
        description="خلاصه‌ی وضعیت واقعی پایگاه داده. هیچ عدد نمایشی یا ساختگی در این داشبورد وجود ندارد."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value) as 7 | 30 | 90)}
              className="min-h-10 rounded-lg border border-ink/12 bg-white px-3 text-[12px] font-semibold text-ink"
              aria-label="بازه‌ی زمانی"
            >
              <option value={7}>۷ روز اخیر</option>
              <option value={30}>۳۰ روز اخیر</option>
              <option value={90}>۹۰ روز اخیر</option>
            </select>
            <Button variant="secondary" onClick={() => setNonce((n) => n + 1)}>
              <RefreshCw className="h-4 w-4" />
              به‌روزرسانی
            </Button>
          </div>
        }
      />

      {loading ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-20 text-[13px] text-body">
            <Loader2 className="h-4 w-4 animate-spin" />
            دریافت آمار از پایگاه داده…
          </div>
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={() => setNonce((n) => n + 1)} />
        </Card>
      ) : cards.length === 0 ? (
        <Card>
          <div className="px-5 py-14 text-center">
            <ShieldAlert className="mx-auto mb-3 h-6 w-6 text-[#9a6a24]" />
            <p className="text-[13px] font-bold text-ink">کارت آماری قابل‌نمایشی وجود ندارد</p>
            <p className="mt-1 text-[12px] text-body">نقش فعلی شما به هیچ‌یک از منابع آماری دسترسی ندارد.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.key} className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}>
                  <card.icon className="h-4.5 w-4.5" />
                </span>
                {card.to && (
                  <Link to={card.to} className="text-[11px] font-bold text-steel hover:text-ink" aria-label={`رفتن به ${card.title}`}>
                    مشاهده
                  </Link>
                )}
              </div>
              <p className="text-[12px] font-semibold text-body">{card.title}</p>
              <p className="mt-1 text-2xl font-black text-ink">{toFa(card.value ?? 0)}</p>
              <p className="mt-2 text-[11px] leading-5 text-body/85">{card.sub}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {can("audit", "read") && (
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
              <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-ink">
                <Activity className="h-4 w-4 text-steel" />
                فعالیت‌های مدیریتی اخیر
              </h2>
              <Link to="/admin/audit-logs" className="flex items-center gap-1 text-[11px] font-bold text-steel">
                همه‌ی رویدادها
                <ArrowLeft className="h-3 w-3" />
              </Link>
            </div>
            {activity.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px] text-body">هنوز رویدادی ثبت نشده است.</div>
            ) : (
              <ul className="divide-y divide-ink/5">
                {activity.map((log) => (
                  <li key={log.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-[12px]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mist text-steel">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-bold text-ink">{log.action}</span>
                    <span className="text-body">روی {log.resource_type}</span>
                    {log.actor_email && <span dir="ltr" className="text-[11px] text-body/80">{log.actor_email}</span>}
                    <span className="ms-auto flex items-center gap-1 text-[10.5px] text-fog">
                      <Clock3 className="h-3 w-3" />
                      {formatDate(log.created_at, true)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <div className="space-y-4">
          {can("settings", "api") && (
            <Card>
              <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-ink">
                  <Globe2 className="h-4 w-4 text-steel" />
                  وضعیت سرویس‌ها
                </h2>
                <Link to="/admin/api-settings" className="text-[11px] font-bold text-steel">مدیریت</Link>
              </div>
              {services.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12px] text-body">
                  سرویسی ثبت نشده است؛ در بخش «سرویس‌ها و API» تنظیمات غیرمحرمانه را اضافه کنید.
                </div>
              ) : (
                <ul className="divide-y divide-ink/5">
                  {services.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                      <span className="text-[12px] font-bold text-ink">{s.name}</span>
                      <StatusBadge status={s.last_check_status ?? "unconfigured"} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card>
            <div className="border-b border-ink/8 px-4 py-3">
              <h2 className="text-[13px] font-extrabold text-ink">دسترسی سریع</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {[
                { to: "/admin/tests", label: "آزمون‌ها", icon: TestTube2, perm: ["tests", "read"] as [string, string] },
                { to: "/admin/pages", label: "بخش‌های سایت", icon: FileText, perm: ["content", "read"] as [string, string] },
                { to: "/admin/media", label: "رسانه‌ها", icon: BookOpen, perm: ["media", "read"] as [string, string] },
                { to: "/admin/messages", label: "پشتیبانی", icon: Inbox, perm: ["support", "read"] as [string, string] },
                { to: "/admin/settings", label: "تنظیمات", icon: Globe2, perm: ["settings", "read"] as [string, string] },
                { to: "/admin/admins", label: "مدیران", icon: Users, perm: ["admins", "read"] as [string, string] },
              ]
                .filter((l) => can(l.perm[0], l.perm[1]))
                .map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border border-ink/8 bg-[#f9fbfd] text-[11.5px] font-bold text-ink hover:border-steel/30 hover:bg-white"
                  >
                    <link.icon className="h-4 w-4 text-steel" />
                    {link.label}
                  </Link>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
