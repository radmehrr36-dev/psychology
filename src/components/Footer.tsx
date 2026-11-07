import { useCallback, useState } from "react";
import { Mail, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Modal } from "./Modal";
import { SupportForm } from "./SupportForm";
import { WaveEdge } from "./WaveEdge";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V8h4v2.5A5 5 0 0 0 11 8z" />
      <rect width="4" height="12" x="2" y="9" rx="1" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const footerNav = [
  { label: "خانه", href: "/" },
  { label: "داشبورد", href: "/#dashboard" },
  { label: "آزمون‌ها", href: "/#tests" },
  { label: "نقشه‌ی رشد", href: "/#map" },
  { label: "مراحل کار", href: "/#steps" },
  { label: "دستیار هوشمند", href: "/#assistant" },
];

const contentNav = [
  { label: "مقالات", href: "/articles" },
  { label: "مجلات", href: "/magazines" },
  { label: "کتاب‌ها و منابع", href: "/books" },
  { label: "متخصصان", href: "/psychologists" },
];

const socials: { icon: ComponentType<{ className?: string }>; label: string; href: string }[] = [
  { icon: InstagramIcon, label: "اینستاگرام", href: "https://instagram.com" },
  { icon: Send, label: "تلگرام", href: "https://telegram.org" },
  { icon: LinkedinIcon, label: "لینکدین", href: "https://linkedin.com" },
];

const legalDocs = {
  privacy: {
    title: "حریم خصوصی",
    body: "آریاسازه حریم خصوصی کاربران را از اولویت‌های اصلی می‌داند. داده‌های آزمون و پیشرفت شما در Supabase و با سیاست‌های Row Level Security نگهداری می‌شوند و بدون اطلاع‌رسانی صریح با شخص ثالث به اشتراک گذاشته نمی‌شوند. اطلاعات حساس مانند رمز عبور و کلیدهای API در پایگاه داده‌ی عمومی ذخیره نمی‌شوند. نسخه‌ی کامل سند حریم خصوصی پیش از انتشار رسمی محصول منتشر خواهد شد.",
  },
  terms: {
    title: "قوانین و مقررات",
    body: "محتوای آریاسازه شامل آزمون‌ها، گزارش‌ها و تمرین‌ها، صرفاً جهت خودشناسی و رشد فردی ارائه می‌شود و جایگزین تشخیص یا درمان تخصصی روان‌شناختی نیست. در صورت نیاز به کمک تخصصی، با متخصص سلامت روان مشورت کنید. انتشار آزمون‌ها مستلزم بازبینی علمی و انتشار نسخه است. بازنشر محتوا بدون اجازه‌ی کتبی ممنوع است.",
  },
};

export function Footer() {
  const [doc, setDoc] = useState<keyof typeof legalDocs | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const close = useCallback(() => setDoc(null), []);

  return (
    <footer id="about" className="relative bg-paper scroll-mt-20">
      <WaveEdge from="#F1EBE2" />
      <div className="relative z-[2] mx-auto max-w-[80rem] px-5 pb-14 pt-24 md:pt-28">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo />
            <p className="mt-5 max-w-sm text-[14px] leading-7 text-body">
              آریاسازه پلتفرمی برای خودشناسی و رشد فردی است: آزمون‌های کوتاه، گزارش‌های شخصی، تمرین‌های روزانه و
              پیگیری پیشرفت، با تکیه بر دانش روان‌شناسی و همراهی متخصصان.
            </p>
            <a href="mailto:salam@ariasazeh.ir" className="mt-5 inline-flex min-h-11 items-center gap-2 text-[14px] font-bold text-steel transition-colors hover:text-ink">
              <Mail className="h-4 w-4" />
              salam@ariasazeh.ir
            </a>
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="mt-2 flex min-h-11 items-center gap-2 text-[14px] font-bold text-steel transition-colors hover:text-ink"
            >
              <MessageSquareText className="h-4 w-4" />
              ارسال پیام به پشتیبانی
            </button>
          </div>

          <nav className="md:col-span-3" aria-label="ناوبری فوتر">
            <p className="mb-4 text-[14px] font-extrabold text-ink">بخش‌های سایت</p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {footerNav.map((item) => (
                <li key={item.href}>
                  {item.href.startsWith("/") && !item.href.includes("#") ? (
                    <Link to={item.href} className="inline-flex min-h-9 items-center text-[14px] font-semibold text-body transition-colors hover:text-ink">{item.label}</Link>
                  ) : (
                    <a href={item.href} className="inline-flex min-h-9 items-center text-[14px] font-semibold text-body transition-colors hover:text-ink">{item.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <p className="mb-4 text-[14px] font-extrabold text-ink">محتوا</p>
            <ul className="space-y-2.5">
              {contentNav.map((item) => (
                <li key={item.href}>
                  {item.href.startsWith("/") && !item.href.includes("#") ? (
                    <Link to={item.href} className="inline-flex min-h-9 items-center text-[14px] font-semibold text-body transition-colors hover:text-ink">{item.label}</Link>
                  ) : (
                    <a href={item.href} className="inline-flex min-h-9 items-center text-[14px] font-semibold text-body transition-colors hover:text-ink">{item.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="mb-4 text-[14px] font-extrabold text-ink">اطلاعات</p>
            <ul className="space-y-2.5">
              <li><button type="button" onClick={() => setDoc("privacy")} className="inline-flex min-h-9 items-center text-[14px] font-semibold text-body transition-colors hover:text-ink">حریم خصوصی</button></li>
              <li><button type="button" onClick={() => setDoc("terms")} className="inline-flex min-h-9 items-center text-[14px] font-semibold text-body transition-colors hover:text-ink">قوانین و مقررات</button></li>
              <li><Link to="/admin/login" className="inline-flex min-h-9 items-center gap-1 text-[14px] font-semibold text-body transition-colors hover:text-ink"><ShieldCheck className="h-3.5 w-3.5" />ورود مدیران</Link></li>
            </ul>
            <div className="mt-4 flex items-center gap-2.5">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-steel ring-1 ring-ink/5 transition-all hover:-translate-y-0.5 hover:bg-steel hover:text-white">
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink/5 pt-7 text-center sm:flex-row sm:text-right">
          <p className="text-[14px] font-medium text-body">© ۲۰۲۵ آریاسازه، تمامی حقوق محفوظ است.</p>
          <p className="text-[14px] font-medium text-fog">محتوای این وب‌سایت جایگزین مشاوره‌ی تخصصی نیست.</p>
        </div>
      </div>

      <Modal open={doc !== null} onClose={close} title={doc ? legalDocs[doc].title : ""}>
        {doc && (
          <>
            <p className="mb-6 text-[14px] font-medium leading-7 text-body">{legalDocs[doc].body}</p>
            <button type="button" onClick={close} className="min-h-12 w-full rounded-full bg-ink px-5 text-[14px] font-bold text-white transition-colors hover:bg-ink-deep">
              متوجه شدم
            </button>
          </>
        )}
      </Modal>

      <SupportForm open={supportOpen} onClose={() => setSupportOpen(false)} />
    </footer>
  );
}
