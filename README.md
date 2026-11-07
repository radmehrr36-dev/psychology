# آریاسازه — سایت عمومی + پنل مدیریت (React + Vite + Supabase)

این پروژه، وب‌سایت عمومی آریاسازه را حفظ می‌کند و یک لایه‌ی مدیریت واقعی مبتنی بر Supabase (PostgreSQL، Auth، RLS، Storage و Edge Functions) به آن اضافه می‌کند. هیچ داده‌ی ساختگی در داشبورد مدیریت تولید نمی‌شود؛ اگر پایگاه داده خالی باشد، عدد واقعی صفر و حالت خالی نمایش داده می‌شود و اگر اتصال پیکربندی نشده باشد، وضعیت عدم اتصال به‌صراحت اعلام می‌شود.

## وضعیت فعلی (مهم)

- کد فرانت‌اند و migrationها در این مخزن کامل هستند.
- **اتصال Supabase برقرار است**: مقادیر `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` در `.env.local` قرار دارند (کلید publishable عمومی). migrationهای پایه روی پروژه اعمال شده‌اند؛ جدول‌های `site_sections`، `tests`، `categories`، `site_settings` و bucket `site-media` پاسخ می‌دهند و نوشتن ناشناس توسط RLS مسدود می‌شود.
- اگر بخش‌های «ترتیب»، «گالری» یا «شناخت بهتر خود» در فهرست بخش‌های پنل نبود، با دکمه‌ی **«افزودن بخش‌های استاندارد»** در `/admin/pages` (یا اجرای `supabase/migrations/20260103000000_layout_gallery_seed.sql`) ساخته می‌شوند.
- تست‌های زنده‌ی انجام‌شده: دریافت محتوای صفحه‌ی اصلی از دیتابیس، نمایش صفحه‌ی ورود واقعی در `/admin/login`، خطای «ایمیل یا رمز عبور نادرست است» برای اعتبارنامه‌ی اشتباه، و ارسال درخواست بازیابی رمز. ورود با حساب مدیر واقعی و عملیات نوشتن نیاز به اعتبارنامه‌ی مدیر دارد و در این محیط تست نشده است.

## معماری

```
src/
  App.tsx                 مسیرهای عمومی + /admin
  components/             سایت عمومی (Hero, Tests, CTA, Footer, SupportForm, …)
  site/PublicContent.tsx  صفحات عمومی CMS (مقالات، مجلات، کتاب‌ها، صفحات، متخصصان)
  lib/
    supabase.ts           کلاینت anon + خطاهای قابل‌فهم
    auth.tsx              نشست، پروفایل، نقش و مجوزها
    siteData.tsx          دریافت Hero/CTA/آزمون‌های منتشرشده + fallback شفاف
    types.ts              تایپ‌های دامنه
  admin/
    AdminApp.tsx          مسیرهای محافظت‌شده + صفحه‌ی Setup
    AdminShell.tsx        سایدبار/هدر/خروج امن
    LoginPage.tsx         ورود، بازیابی رمز، نمایش وضعیت نشست
    CrudPage.tsx          جدول/فرم/جست‌وجو/صفحه‌بندی/انتشار/حذف
    ui.tsx                کامپوننت‌های مشترک و اعلان‌ها
    hooks.ts              کوئری‌های فهرست با جست‌وجو و صفحه‌بندی سمت سرور
    pages/                داشبورد، کاربران، مدیران، آزمون‌ها، محتوا، رسانه،
                          پشتیبانی، متخصصان، سرویس‌ها/API، رویدادها، تنظیمات
supabase/
  config.toml             اجرای محلی
  migrations/             schema + RLS + trigger + seed مجوزها
  functions/admin/        Edge Function عملیات حساس (دعوت مدیر، نقش، بررسی سرویس)
scripts/bootstrap-admin.mjs  ساخت امن اولین مدیر ارشد (service_role، خارج از مرورگر)
```

### لایه‌ی داده

جدول‌های اصلی: `profiles`, `role_permissions`, `audit_logs`, `admin_invites`, `user_notes`, `site_settings`, `categories`, `pages`, `site_sections`, `tests`, `test_versions`, `test_questions`, `test_question_options`, `test_interpretations`, `articles`, `magazines`, `books`, `media`, `support_messages`, `support_replies`, `psychologists`, `psychologist_documents`, `service_settings`.

- نسخه‌ی منتشرشده‌ی آزمون با trigger قفل می‌شود و هنگام انتشار، `snapshot` (سؤال‌ها، گزینه‌ها، امتیازها، تفسیرها) در سمت سرور ساخته می‌شود.
- انتشار فقط پس از `approved` توسط نقش دارای `tests.review` و با نقش دارای `tests.publish` ممکن است (`publish_test_version`).
- تغییر نقش/وضعیت حساب از Edge Function و با بررسی مجوز سمت سرور انجام می‌شود؛ trigger از آخرین `super_admin` و تغییر نقش خود جلوگیری می‌کند.
- `audit_logs` فقط توسط triggerهای `SECURITY DEFINER` نوشته می‌شود و هیچ policy برای INSERT/UPDATE/DELETE کلاینتی ندارد.

### مجوزها

نقش‌ها: `super_admin`, `admin`, `content_manager`, `test_manager`, `support_agent`, `psychology_reviewer`.

مجوزها با `role_permissions(resource, action)` انعطاف‌پذیرند. نمونه‌ها: `content.write`, `tests.publish`, `tests.review`, `media.write`, `users.write`, `admins.write`, `support.read`, `settings.api`, `audit.read`, `psychologists.manage_documents`.
مدیر ارشد از تمام بررسی‌ها عبور می‌کند. در seed اولیه فقط `super_admin` مجوز `admins.write` دارد.

## راه‌اندازی

### پیش‌نیازها
- Node.js 20+
- یک پروژه‌ی Supabase (برای حالت کامل)
- Supabase CLI و Docker فقط برای حالت محلی اختیاری

### ۱) نصب و اجرا

```bash
npm install
cp .env.example .env.local
# مقادیر VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY را در .env.local قرار دهید
npm run dev
```

سایت: `http://localhost:5173` — پنل: `http://localhost:5173/admin`

### ۲) ساخت پروژه‌ی Supabase

1. در [supabase.com](https://supabase.com) پروژه بسازید.
2. `Project Settings → API` را باز کنید و `Project URL` و کلید `anon` (یا publishable) را در `.env.local` بگذارید.
3. در `Authentication → Providers → Email`، ثبت‌نام عمومی را غیرفعال نگه دارید (توصیه‌شده)؛ حساب مدیران با دعوت / bootstrap ساخته می‌شود.
4. `Authentication → URL Configuration` → `Site URL = http://localhost:5173` و `Redirect URLs` شامل `http://localhost:5173/admin/login`.

> در حالت Cloud هیچ‌گاه کلید `service_role` را در فایل `.env` با پیشوند `VITE_` یا در کد فرانت‌اند قرار ندهید.

### ۳) اعمال migrationها

روش CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

روش SQL Editor (به‌ترتیب):

1. `supabase/migrations/20260101000000_init.sql`
2. `supabase/migrations/20260101000001_storage.sql`

migration دوم bucketهای `site-media` (عمومی) و `private-documents` (خصوصی) را می‌سازد و سیاست‌های Storage را تنظیم می‌کند. فایل‌های مجاز: JPEG/PNG/WebP/AVIF/PDF (سند خصوصی: PDF/JPEG/PNG). SVG و فایل اجرایی مجاز نیست.

### ۴) ساخت اولین مدیر ارشد (bootstrap)

```bash
SUPABASE_URL="https://YOUR_REF.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="..." \
ADMIN_EMAIL="you@example.com" \
ADMIN_PASSWORD="یک-رمز-قوی-حداقل-۱۲-کاراکتر" \
node scripts/bootstrap-admin.mjs
```

یا با دعوت ایمیلی:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... node scripts/bootstrap-admin.mjs --invite
```

- ثبت‌نام عمومی مدیر وجود ندارد؛ کاربر با ثبت‌نام مستقیم پروفایل `pending` و بدون نقش می‌گیرد و به پنل دسترسی ندارد.
- پروفایل سایر مدیران پس از این، فقط از صفحه‌ی «مدیران و دسترسی‌ها» و از طریق Edge Function دعوت می‌شود.

### ۵) استقرار Edge Function و secrets

```bash
supabase functions deploy admin
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   # در صورت نیاز پروژه
supabase secrets set OPENAI_API_KEY=...              # نمونه؛ هرگز در دیتابیس/فرانت‌اند نگذارید
```

در `service_settings.secret_name` فقط **نام** متغیر (مثلاً `OPENAI_API_KEY`) ثبت می‌شود. مقدار کلید در `Supabase secrets` می‌ماند. «بررسی کلید» و «بررسی اتصال» فقط با Edge Function مستقرشده کار می‌کنند و نتیجه‌ی ناموفق/پیکربندی‌نشده را صادقانه ثبت می‌کنند.

### ۶) اجرای محلی Supabase (اختیاری)

نیازمند **Docker Desktop** و Supabase CLI است. در این محیط نصب/اجرا نشده و مورد ادعا نیست.

```bash
supabase start
supabase db reset            # migrationها را اجرا می‌کند
# URL و anon key چاپ‌شده را در .env.local قرار دهید
supabase functions serve admin
```

`supabase/config.toml` ثبت‌نام عمومی را غیرفعال و redirectهای محلی را تنظیم کرده است.

## نگاشت CMS به سایت عمومی

| بخش سایت | منبع داده |
|---|---|
| Hero (عنوان، توضیح، دو CTA، تصویر اختیاری) | `site_sections` با `key='hero'` و `status='published'` (پیش‌نویس از طریق `draft_config`) |
| کارت‌های آزمون (عنوان، توضیح، زمان، نوع گزارش، دسته، ترتیب) | `tests` با `status='published'` و `review_status='approved'` |
| بنر پایان�� | `site_sections` با `key='cta'` |
| SEO پیش‌فرض | `site_settings` با `key='seo.default'` و `is_public=true` |
| مقالات/مجلات/کتاب‌ها | جدول‌های مربوطه با `status='published'` |
| صفحات ثابت | `pages` با `status='published'` در مسیر `/p/:slug` |
| متخصصان | `psychologists` با `is_active=true` و `verification_status='verified'` |

اگر Supabase پیکربندی نشده باشد یا اتصال خطا بدهد، سایت عمومی محتوای پیش‌فرض را نشان می‌دهد و در بخش آزمون‌ها هشدار می‌دهد. اگر پایگاه داده متصل باشد و آزمون منتشرشده‌ای وجود نداشته باشد، حالت خالی رسمی نمایش داده می‌شود و هیچ آزمون ساختگی جای داده‌ی واقعی نمی‌گذارد.

## تست‌ها

```bash
npx tsc --noEmit     # بررسی TypeScript
npm run build        # build نهایی Vite + single-file
npm run dev          # اجرای محلی
```

تست‌های انجام‌شده در این محیط (بدون credential):

- نصب وابستگی‌ها، `tsc --noEmit` بدون خطا و `npm run build` موفق.
- بارگذاری صفحه‌ی عمومی و بررسی نبود خطای کنسول/اسکرول افقی در عرض‌های ۳۶۰ تا ۱۴۴۰ (Playwright) — در صورت نصب مرورگر.
- `/admin` در حالت بدون Supabase → صفحه‌ی راهنمای اتصال، بدون فرم ورود جعلی.

تست‌های وابسته به Supabase که **انجام نشده‌اند**: ورود واقعی، دعوت مدیر، RLS، CRUD روی داده‌ی واقعی، آپلود Storage، انتشار آزمون، ثبت و پاسخ پیام، audit log.

### چه چیزی را خودتان بعد از اتصال تست کنید

1. ورود مدیر ارشد و خروج/بازیابی رمز.
2. ایجاد آزمون → افزودن نسخه/سؤال/گزینه/بازه‌ی تفسیر → ارسال برای بازبینی → تأیید با نقش `psychology_reviewer` → انتشار با `test_manager`/`super_admin` → مشاهده در صفحه‌ی اصلی.
3. تغییر متن Hero → ذخیره‌ی پیش‌نویس (سایت نباید تغییر کند) → انتشار (سایت باید تغییر کند).
4. آپلود تصویر، استفاده از URL در مقاله، سپس تلاش حذف (باید به‌دلیل استفاده‌شدن مسدود شود).
5. ثبت پیام از فرم پشتیبانی سایت → مشاهده در پنل → ثبت پاسخ → بررسی `audit_logs`.
6. قطع موقت اتصال شبکه/Supabase و بررسی پیام‌های خطا.

## محدودیت‌ها و موارد باقی‌مانده

- **اتصال Supabase**: تا وقتی `.env.local` و migration اجرا نشده‌اند، پنل فقط راهنمای Setup نشان می‌دهد.
- **ایمیل**: کانال ارسال پاسخ پشتیبانی (Resend/SMTP) پیاده‌سازی نشده است؛ پاسخ‌ها با `delivery_status='not_sent'` ذخیره می‌شوند و UI این را صریح اعلام می‌کند. دعوت مدیران از ایمیل داخلی Supabase Auth استفاده می‌کند (نیازمند تنظیم SMTP در پروژه‌ی واقعی برای تحویل مطمئن).
- **احراز هویت کاربران عمومی** و مسیر اجرای آزمون/ذخیره‌ی پاسخ‌ها و گزارش نتایج پیاده‌سازی نشده است؛ پنل فقط مدیریت نسخه و سؤال‌ها را پوشش می‌دهد. آزمون‌های منتشرشده در سایت معرفی می‌شوند.
- **ویرایشگر غنی**: متن مقالات/صفحات به‌صورت متن ساده ذخیره و با `white-space: pre-line` نمایش داده می‌شود (بدون `dangerouslySetInnerHTML`)؛ بنابراین ویرایشگر WYSIWYG و sanitizer سمت سرور وجود ندارد.
- **پرداخت/قیمت**: فیلدهای آزاد/قیمت در schema هستند، اما درگاه پرداخت و مدیریت سفارش پیاده‌سازی نشده‌اند.
- **سقف مصرف سرویس‌ها**: عدد آن صرفاً پیکربندی است؛ مصرف واقعی از ارائه‌دهنده خوانده نمی‌شود.
- **تأیید ایمیل کاربران** در جدول کاربران نمایش داده نمی‌شود، چون از API عمومی قابل خواندن نیست.
- **مدارک متخصصان**: مشاهده با signed URL و مجوز `psychologists.manage_documents` است؛ سیستم رزرو/ویزیت وجود ندارد.
- **تعداد پرسنل/درخواست‌ها**: `admin_invites` و `user_notes` محدود به مجوزها هستند؛ ویرایش ماتریس مجوزها فقط برای `super_admin` (به‌دلیل RLS) عملی است.
- **نرخ‌بندی فرم عمومی پشتیبانی** در سطح دیتابیس پیاده‌سازی نشده؛ برای محیط عملیاتی باید rate limiting/کپچا اضافه شود.
- **SPA fallback**: مسیرها با `BrowserRouter` هستند؛ سرور استاتیک باید درخواست‌های `/admin/*` و مسیرهای عمومی را به `index.html` هدایت کند (Vercel: rewrites، Nginx: `try_files`).

## امنیت — خلاصه

- RLS روی تمام جدول‌های عمومی/مدیریتی فعال است؛ نوشتن محتوا نیازمند `content.write`/`tests.write`/`media.write` است.
- تغییر نقش فقط در Edge Function با بررسی JWT + نقش سمت سرور؛ trigger از تنزل آخرین مدیر ارشد و تغییر نقش خود جلوگیری می‌کند.
- `service_role` هرگز در فرانت‌اند استفاده نمی‌شود؛ `.env.example` خالی است.
- کلیدهای API فقط در secrets سرور؛ در DB فقط `secret_name` و وضعیت پیکربندی.
- bucket خصوصی برای مدارک، `public=false` و policy فقط با مجوز مدیریت مدارک.
- audit log فقط‌خواندنی و سمت سرور نوشته می‌شود؛ رمز/توکن/پاسخ‌های خصوصی در آن ثبت نمی‌شود.
- SPA Header/Footer عمومی و صفحه‌ی Setup، داده‌ی حساسی را نمایش نمی‌دهند.

## دستورهای مفید

```bash
npm run dev
npm run build
npx tsc --noEmit
supabase db push
supabase functions deploy admin
supabase secrets list
node scripts/bootstrap-admin.mjs --help
```
