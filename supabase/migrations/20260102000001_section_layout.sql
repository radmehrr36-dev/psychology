-- فرایند دوم: ترتیب بخش‌های صفحه‌ی اصلی + Message قابل بازآیینی
begin;

insert into public.site_sections (key, name, status, sort_order, published_at, config, draft_config)
values
  ('steps-heading','عنوان بخش «چگونه کار می‌کند؟»','published',4, now(),
   '{"label":"مسیر شما","title":"چگونه کار می‌کند؟","description":"از اولین آزمون تا پیگیری پیشرفت، پنج گام ساده و روشن."}'::jsonb,
   '{"label":"مسیر شما","title":"چگونه کار می‌کند؟","description":"از اولین آزمون تا پیگیری پیشرفت، پنج گام ساده و روشن."}'::jsonb),
  ('map','نقشه‌ی رشد','published',5, now(),
   '{"title":"نقشه‌ی رشد فردی","description":"نتایج آزمون‌ها، ثبت‌های روزانه‌ی شما و پیشنهادهای هوشمند، در یک نقشه کنار هم می‌نشینند تا بدانید در هر حوزه کجا هستید و قدم بعدی چیست."}'::jsonb,
   '{"title":"نقشه‌ی رشد فردی","description":"نتایج آزمون‌ها، ثبت‌های روزانه‌ی شما و پیشنهادهای هوشمند، در یک نقشه کنار هم می‌نشیند تا بدانید در هر حوزه کجا هستید و قدم بعدی چیست."}'::jsonb)
on conflict (key) do nothing;

commit;
