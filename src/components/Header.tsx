import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Menu, ShieldCheck, X } from "lucide-react";
import { Logo } from "./Logo";
import { Modal } from "./Modal";
import { cn } from "../utils/cn";

const navItems = [
  { label: "خانه", href: "#top", id: "top" },
  { label: "آزمون‌ها", href: "#tests", id: "tests" },
  { label: "دستیار هوشمند", href: "#assistant", id: "assistant" },
  { label: "تمرین‌ها و برنامه‌ها", href: "#map", id: "map" },
  { label: "درباره ما", href: "#about", id: "about" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [activeId, setActiveId] = useState("top");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // تشخیص بخش فعال برای هایلایت لینک‌ها
  useEffect(() => {
    const targets = navItems
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.2, 0.5] }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const linkClass = (id: string, mobile = false) =>
    cn(
      "relative rounded-full font-semibold transition-colors duration-300",
      mobile ? "block min-h-11 px-4 py-3 text-base" : "px-1 py-2 text-base",
      activeId === id ? (mobile ? "bg-white text-ink" : "text-ink") : "text-body hover:text-ink",
      mobile && activeId !== id && "hover:bg-white/70"
    );

  return (
    <>
      <header
        className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-500", scrolled ? "py-2.5" : "py-4 md:py-5")}
      >
        <div className="mx-auto max-w-[80rem] px-4 md:px-5">
          <div
            className={cn(
              "flex items-center justify-between rounded-full py-2 pr-3 pl-3 transition-all duration-500 md:px-4",
              scrolled ? "glass shadow-glass" : "border border-transparent"
            )}
          >
            <Logo />

            <nav className="hidden items-center gap-7 lg:flex" aria-label="ناوبری اصلی">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={linkClass(item.id)}
                  aria-current={activeId === item.id ? "page" : undefined}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute -bottom-1.5 right-1/2 h-[3px] w-5 translate-x-1/2 rounded-full bg-ink transition-opacity duration-300",
                      activeId === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* لینک متنی ساده */}
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="hidden min-h-11 items-center px-2 text-base font-semibold text-body transition-colors duration-300 hover:text-ink sm:flex"
              >
                ورود / ثبت‌نام
              </button>

              {/* تنها دکمه‌ی رنگی هدر */}
              <a
                href="#steps"
                className="hidden min-h-11 items-center gap-2 rounded-full bg-coral px-5 text-base font-bold text-ink shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-coral-deep sm:inline-flex"
              >
                شروع مسیر من
                <ArrowLeft className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "بستن منو" : "بازکردن منو"}
                aria-expanded={open}
                aria-controls="mobile-nav"
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors duration-300 hover:bg-white/70 lg:hidden"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {open && (
              <motion.nav
                id="mobile-nav"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="glass mt-2 space-y-1 rounded-3xl p-3 shadow-glass lg:hidden"
                aria-label="منوی موبایل"
              >
                {navItems.map((item) => (
                  <a key={item.id} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.id, true)}>
                    {item.label}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setAuthOpen(true);
                  }}
                  className="block min-h-11 w-full rounded-2xl px-4 py-3 text-right text-base font-semibold text-body transition-colors hover:bg-white/70 hover:text-ink"
                >
                  ورود / ثبت‌نام
                </button>
                <a
                  href="#steps"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-coral px-4 text-base font-bold text-ink transition-colors hover:bg-coral-deep"
                >
                  شروع مسیر من
                  <ArrowLeft className="h-4 w-4" />
                </a>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* وضعیت شفاف: حساب کاربری کاربران هنوز فعال نیست */}
      <Modal
        open={authOpen}
        onClose={closeAuth}
        title="حساب کاربری کاربران به‌زودی"
        leading={
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral/20 text-ink">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
          </span>
        }
      >
        <p className="mb-5 text-base leading-8 text-body">
          سامانه‌ی ورود و ثبت‌نام آریاسازه هنوز در دست آماده‌سازی است و در این نسخه فعال نیست. تا آن زمان می‌توانید با
          بخش‌های معرفی محصول آشنا شوید یا از طریق ایمیل با ما در ارتباط باشید.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <a
            href="#steps"
            onClick={closeAuth}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-ink px-5 text-base font-bold text-white transition-colors duration-300 hover:bg-ink-deep"
          >
            آشنایی با مسیر آریاسازه
          </a>
          <a
            href="/admin/login"
            onClick={closeAuth}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/15 px-5 text-base font-bold text-ink transition-colors duration-300 hover:bg-white"
          >
            <ShieldCheck className="h-4 w-4" />
            ورود مدیران
          </a>
        </div>
      </Modal>
    </>
  );
}
