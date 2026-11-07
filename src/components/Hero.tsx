import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowDown, ArrowLeft, Info, ShieldCheck, Stethoscope } from "lucide-react";
import { defaultHero, type HeroContent } from "../lib/siteData";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const trust = [
  { icon: ShieldCheck, label: "محرمانه" },
  { icon: Stethoscope, label: "همراه با متخصصان" },
  { icon: Info, label: "جایگزین درمان نیست" },
];

function Orb() {
  const reduce = useReducedMotion();
  return (
    <div className="group relative mx-auto aspect-square w-full max-w-[19rem] sm:max-w-[24rem] lg:max-w-[30rem] xl:-me-8" aria-hidden="true">
      <div className="ai-halo absolute inset-[-14%] rounded-full blur-2xl" />
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
      >
        <motion.div
          className="absolute inset-0"
          animate={reduce ? {} : { scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-[3%] rounded-full border border-white/60 shadow-[0_0_40px_-18px_rgb(63_94_120/0.5)]" />
          <div
            className="absolute inset-[10%] rounded-full shadow-[0_30px_70px_-38px_rgb(63_94_120/0.6),inset_0_-18px_44px_-24px_rgb(63_94_120/0.4)] transition-[filter,box-shadow] duration-700 group-hover:brightness-[1.06]"
            style={{ background: "radial-gradient(circle at 32% 26%, #ffffff 0%, #f2f6fa 18%, #dbe7f2 42%, #cbc3ec 70%, #f2cbb2 100%)" }}
          />
          <div className="absolute inset-[20%] rounded-full bg-[radial-gradient(circle_at_38%_30%,rgba(255,255,255,0.92),rgba(255,255,255,0)_62%)]" />
          <div className="absolute inset-[34%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95),rgba(255,255,255,0)_72%)] blur-[2px]" />
          <div className="ai-core absolute inset-[40%] rounded-full opacity-70 blur-[6px] transition-opacity duration-700 group-hover:opacity-95" />
          <div className="absolute left-[24%] top-[18%] h-[13%] w-[24%] -rotate-[28deg] rounded-full bg-white/80 blur-[3px]" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function VideoOrbHeart({ url }: { url: string }) {
  return (
    <div className="mx-auto aspect-square w-full max-w-[19rem] overflow-hidden rounded-full shadow-card sm:max-w-[24rem] lg:max-w-[30rem] xl:-me-8">
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        className="h-full w-full object-cover"
        aria-hidden="true"
      />
    </div>
  );
}

function HeroMedia({ content }: { content: HeroContent }) {
  const { mediaType, imageUrl, videoUrl } = content;

  if (mediaType === "video" && videoUrl) return <VideoOrbHeart url={videoUrl} />;
  if (mediaType === "image" && imageUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
        className="mx-auto aspect-square w-full max-w-[19rem] sm:max-w-[24rem] lg:max-w-[30rem] xl:-me-8"
      >
        <img src={imageUrl} alt="هسته‌ی تصویری آریاسازه" width={1024} height={1024} className="h-full w-full rounded-full object-cover shadow-card" />
      </motion.div>
    );
  }
  return <Orb />;
}

export function Hero({ content = defaultHero }: { content?: HeroContent }) {
  return (
    <section id="top" className="relative overflow-hidden bg-cream">
      <div className="noise pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(ellipse_60%_55%_at_70%_18%,rgb(234_240_244/0.9),transparent_70%)]" aria-hidden="true" />

      <div className="relative mx-auto max-w-[80rem] px-5 pb-16 pt-28 md:pt-36 lg:pb-24">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
          <motion.div variants={container} initial="hidden" animate="show" className="text-right lg:col-span-6">
            <motion.p variants={item} className="section-label mb-4">
              {content.eyebrow}
            </motion.p>
            <motion.h1 variants={item} className="mb-6 text-[2.25rem] font-semibold leading-[1.4] text-ink sm:text-[2.6rem] lg:text-[3.1rem]">
              {content.titleLine1}
              <br />
              <span className="relative inline-block">
                {content.titleLine2}
                <svg viewBox="0 0 220 14" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-x-0 -bottom-1.5 h-3 w-full">
                  <path d="M4 9 C48 3, 96 12, 146 6 S 204 4, 216 8" fill="none" stroke="var(--color-coral)" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
                </svg>
              </span>
            </motion.h1>
            <motion.p variants={item} className="section-lead mb-9">
              {content.description}
            </motion.p>
            <motion.div variants={item} className="flex flex-wrap items-center gap-3">
              <a href={content.primaryCta.href} className="group inline-flex min-h-12 items-center gap-2.5 rounded-full bg-coral px-7 text-base font-bold text-ink shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-coral-deep">
                {content.primaryCta.label}
                <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
              </a>
              <a href={content.secondaryCta.href} className="inline-flex min-h-12 items-center rounded-full border border-steel/30 px-6 text-base font-bold text-steel transition-colors duration-300 hover:border-steel hover:bg-white/70">
                {content.secondaryCta.label}
              </a>
            </motion.div>
            <motion.ul variants={item} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {trust.map((t) => (
                <li key={t.label} className="flex items-center gap-2 text-[15px] font-medium text-body">
                  <t.icon className="h-4.5 w-4.5 text-steel" strokeWidth={1.8} />
                  {t.label}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          <div className="order-first lg:order-none lg:col-span-6">
            <HeroMedia content={content} />
          </div>
        </div>
      </div>

      <a href="#assistant" aria-label="رفتن به بخش بعدی" className="absolute bottom-8 right-5 hidden flex-col items-center gap-2 text-steel transition-colors hover:text-ink lg:flex">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-steel/20 bg-white/70">
          <ArrowDown className="h-4.5 w-4.5" />
        </span>
      </a>
    </section>
  );
}
