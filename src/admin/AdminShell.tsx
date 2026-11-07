import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Bot,
  ChevronLeft,
  FileText,
  Globe2,
  Image as ImageIcon,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { LogoMark } from "../components/Logo";
import { useAuth } from "../lib/auth";
import { supabaseProjectHost } from "../lib/supabase";
import { roleLabels, type AppRole } from "../lib/types";
import { cn } from "../utils/cn";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: [string, string];
  end?: boolean;
}

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "نمای کلی",
    items: [
      { to: "/admin", label: "داشبورد", icon: LayoutDashboard, end: true },
      { to: "/admin/audit-logs", label: "رویدادهای مدیریتی", icon: Activity, permission: ["audit", "read"] },
    ],
  },
  {
    title: "محتوا",
    items: [
      { to: "/admin/pages", label: "صفحات و بخش‌ها", icon: FileText, permission: ["content", "read"] },
      { to: "/admin/articles", label: "مقالات", icon: Newspaper, permission: ["content", "read"] },
      { to: "/admin/magazines", label: "مجلات", icon: Library, permission: ["content", "read"] },
      { to: "/admin/books", label: "کتاب‌ها و منابع", icon: BookOpen, permission: ["content", "read"] },
      { to: "/admin/media", label: "کتابخانه‌ی رسانه", icon: ImageIcon, permission: ["media", "read"] },
    ],
  },
  {
    title: "آزمون‌ها و افراد",
    items: [
      { to: "/admin/tests", label: "آزمون‌های روان‌شناختی", icon: Bot, permission: ["tests", "read"] },
      { to: "/admin/psychologists", label: "متخصصان", icon: Stethoscope, permission: ["psychologists", "read"] },
      { to: "/admin/users", label: "کاربران", icon: Users, permission: ["users", "read"] },
      { to: "/admin/admins", label: "مدیران و دسترسی‌ها", icon: ShieldCheck, permission: ["admins", "read"] },
      { to: "/admin/messages", label: "پیام‌های پشتیبانی", icon: MessageSquare, permission: ["support", "read"] },
    ],
  },
  {
    title: "سیستم",
    items: [
      { to: "/admin/api-settings", label: "سرویس‌ها و API", icon: Globe2, permission: ["settings", "api"] },
      { to: "/admin/settings", label: "تنظیمات سایت", icon: Settings, permission: ["settings", "read"] },
    ],
  },
];

const titles: Record<string, string> = {
  "/admin": "داشبورد",
  "/admin/users": "کاربران",
  "/admin/admins": "مدیران و دسترسی‌ها",
  "/admin/tests": "آزمون‌های روان‌شناختی",
  "/admin/pages": "صفحات و بخش‌های سایت",
  "/admin/media": "کتابخانه‌ی رسانه",
  "/admin/magazines": "مجلات",
  "/admin/articles": "مقالات",
  "/admin/books": "کتاب‌ها و منابع",
  "/admin/messages": "پیام‌های پشتیبانی",
  "/admin/psychologists": "متخصصان",
  "/admin/api-settings": "سرویس‌ها و API",
  "/admin/audit-logs": "رویدادهای مدیریتی",
  "/admin/settings": "تنظیمات سایت",
};

export function AdminShell() {
  const { can, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const pageTitle =
    titles[location.pathname] ??
    Object.entries(titles).find(([k]) => k !== "/admin" && location.pathname.startsWith(k))?.[1] ??
    "پنل مدیریت";

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink/8 px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8 text-ink" />
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold text-ink">آریاسازه</span>
            <span className="block text-[10px] font-medium text-body">پنل مدیریت</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-body hover:bg-mist lg:hidden"
          aria-label="بستن منوی پنل"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3" aria-label="ناوبری پنل مدیریت">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => !item.permission || can(item.permission[0], item.permission[1]));
          if (items.length === 0) return null;
          return (
            <div key={group.title} className="mb-4">
              <p className="mb-1.5 px-2.5 text-[10.5px] font-bold tracking-wide text-fog">{group.title}</p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[12.5px] font-semibold transition-colors",
                          isActive ? "bg-steel/10 text-ink" : "text-body hover:bg-mist hover:text-ink"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                      <span className="truncate">{item.label}</span>
                      <ChevronLeft className="ms-auto h-3.5 w-3.5 opacity-40" />
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-ink/8 p-3">
        <Link
          to="/"
          className="mb-2 flex min-h-9 items-center justify-between rounded-lg px-2.5 text-[12px] font-semibold text-body hover:bg-mist hover:text-ink"
        >
          مشاهده‌ی سایت
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <div className="rounded-lg bg-[#f8fafc] p-2.5">
          <p className="truncate text-[12px] font-bold text-ink">{profile?.full_name || profile?.email}</p>
          <p className="mt-0.5 text-[10.5px] text-body">{profile?.role ? roleLabels[profile.role as AppRole] : "—"}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-white text-[12px] font-bold text-[#a33a34] ring-1 ring-ink/8 hover:bg-[#fbeceb]"
          >
            <LogOut className="h-3.5 w-3.5" />
            خروج امن
          </button>
        </div>
        {supabaseProjectHost && (
          <p dir="ltr" className="mt-2 truncate text-center text-[9.5px] text-fog">
            {supabaseProjectHost}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-ink">
      {/* سایدبار دسکتاپ */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-ink/8 bg-white lg:block">{sidebar}</aside>

      {/* کشوی موبایل */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/35" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 right-0 w-[17rem] border-l border-ink/8 bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:mr-64">
        <header className="sticky top-0 z-20 border-b border-ink/8 bg-white/95 backdrop-blur">
          <div className="flex min-h-14 items-center gap-3 px-4 md:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-mist lg:hidden"
              aria-label="بازکردن منوی پنل"
              aria-expanded={drawerOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-[12px]">
              <span className="hidden text-body sm:inline">پنل مدیریت</span>
              <ChevronLeft className="hidden h-3 w-3 text-fog sm:block" />
              <span className="truncate font-bold text-ink">{pageTitle}</span>
            </div>
            <div className="ms-auto flex items-center gap-2">
              <Link
                to="/"
                className="hidden min-h-9 items-center gap-1.5 rounded-md border border-ink/10 px-3 text-[11.5px] font-bold text-body hover:bg-mist hover:text-ink sm:flex"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                سایت
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-steel/10 text-[11px] font-extrabold text-steel" aria-hidden="true">
                {(profile?.full_name || profile?.email || "؟").slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[90rem] px-4 py-5 md:px-6 md:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
