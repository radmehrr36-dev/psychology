import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Clock3, Loader2 } from "lucide-react";
import { friendlyError, supabase, supabaseConfigured } from "../lib/supabase";
import { formatDate } from "../admin/ui";

const str = (v: unknown): string => (typeof v === "string" ? v : "");

interface ContentBase {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  published_at: string | null;
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-6 text-[13px] leading-7 text-body">{children}</div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-body">
      <Loader2 className="h-4 w-4 animate-spin" />
      دریافت محتوا…
    </div>
  );
}

function PageHead({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-steel hover:text-ink">
        <ArrowRight className="h-3.5 w-3.5" />
        بازگشت به آریاسازه
      </Link>
      <h1 className="text-2xl font-black text-ink md:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-[13.5px] leading-7 text-body">{description}</p>}
    </header>
  );
}

function ContentGrid({ items, basePath }: { items: ContentBase[]; basePath: string }) {
  if (items.length === 0) {
    return <Notice>هنوز محتوای منتشرشده‌ای در این بخش وجود ندارد. محتوا فقط پس از ایجاد و انتشار در پنل مدیریت نمایش داده می‌شود.</Notice>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link key={item.id} to={`${basePath}/${item.slug}`} className="group overflow-hidden rounded-2xl border border-ink/8 bg-white transition hover:-translate-y-1 hover:shadow-glass">
          {item.cover_url ? (
            <img src={item.cover_url} alt={item.cover_alt ?? item.title} loading="lazy" className="h-40 w-full object-cover" />
          ) : (
            <div className="h-40 w-full bg-gradient-to-br from-mist to-pearl-deep" aria-hidden="true" />
          )}
          <div className="p-4">
            <h2 className="text-[14px] font-bold leading-6 text-ink group-hover:text-steel">{item.title}</h2>
            {item.description && <p className="mt-1.5 line-clamp-2 text-[12px] leading-6 text-body">{item.description}</p>}
            <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-fog">
              <Clock3 className="h-3 w-3" />
              {formatDate(item.published_at)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function useCollection<T>(table: string, select: string, mapper: (row: Record<string, unknown>) => T, order = "published_at") {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [error, setError] = useState<string | null>(supabaseConfigured ? null : "این بخش هنوز به پایگاه داده متصل نیست.");

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from(table)
        .select(select)
        .eq("status", "published")
        .order(order, { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (err) setError(friendlyError(err));
      else {
        setItems(((data ?? []) as unknown as Record<string, unknown>[]).map(mapper));
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return { items, loading, error };
}

const mapContent = (row: Record<string, unknown>): ContentBase => ({
  id: String(row.id),
  slug: String(row.slug),
  title: String(row.title),
  description: (row.description as string | null) ?? (row.excerpt as string | null) ?? null,
  cover_url: (row.cover_url as string | null) ?? null,
  cover_alt: (row.cover_alt as string | null) ?? null,
  published_at: (row.published_at as string | null) ?? null,
});

export function PublicArticlesPage() {
  const { items, loading, error } = useCollection("articles", "id,slug,title,excerpt,cover_url,cover_alt,published_at", mapContent);
  return (
    <>
      <PageHead title="مقالات آریاسازه" description="مقالات منتشرشده درباره‌ی خودشناسی، روان‌شناسی و رشد فردی." />
      {loading ? <Loading /> : error ? <Notice>{error}</Notice> : <ContentGrid items={items} basePath="/articles" />}
    </>
  );
}

export function PublicMagazinesPage() {
  const { items, loading, error } = useCollection("magazines", "id,slug,title,description,cover_url,cover_alt,published_at", mapContent);
  return (
    <>
      <PageHead title="مجلات" description="شماره‌های منتشرشده‌ی مجله‌ی آریاسازه." />
      {loading ? <Loading /> : error ? <Notice>{error}</Notice> : <MagazineList items={items} />}
    </>
  );
}

function MagazineList({ items }: { items: ContentBase[] }) {
  const { error } = useCollection("magazines", "id", () => ({}));
  if (error) return <Notice>{error}</Notice>;
  if (items.length === 0) return <Notice>هنوز مجله‌ای منتشر نشده است.</Notice>;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((m) => (
        <article key={m.id} className="rounded-2xl border border-ink/8 bg-white p-4">
          {m.cover_url && <img src={m.cover_url} alt={m.cover_alt ?? m.title} loading="lazy" className="mb-3 h-44 w-full rounded-xl object-cover" />}
          <h2 className="text-[14px] font-bold text-ink">{m.title}</h2>
          {m.description && <p className="mt-1.5 text-[12px] leading-6 text-body">{m.description}</p>}
          <p className="mt-2 text-[10.5px] text-fog">{formatDate(m.published_at)}</p>
        </article>
      ))}
    </div>
  );
}

export function PublicBooksPage() {
  const { items, loading, error } = useCollection("books", "id,slug,title,description,cover_url,cover_alt,published_at", mapContent);
  return (
    <>
      <PageHead title="کتاب‌ها و منابع" description="منابع معرفی‌شده برای مطالعه‌ی بیشتر. فایل‌ها فقط در صورت داشتن مجوز انتشار عمومی هستند." />
      {loading ? <Loading /> : error ? <Notice>{error}</Notice> : <ContentGrid items={items} basePath="/books" />}
    </>
  );
}

export function PublicArticleView() {
  const { slug = "" } = useParams();
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [error, setError] = useState<string | null>(supabaseConfigured ? null : "این بخش هنوز به پایگاه داده متصل نیست.");

  useEffect(() => {
    if (!supabase || !slug) return;
    let cancelled = false;
    supabase
      .from("articles")
      .select("id,title,excerpt,body,author_name,cover_url,cover_alt,published_at,seo_title,seo_description")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(friendlyError(err));
        else if (!data) setError("این مقاله یافت نشد یا هنوز منتشر نشده است.");
        else setRow(data as Record<string, unknown>);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <Loading />;
  if (error || !row) return <Notice>{error ?? "مقاله یافت نشد."}</Notice>;

  return (
    <article className="mx-auto max-w-2xl">
      <Link to="/articles" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-steel"><ArrowRight className="h-3.5 w-3.5" />همه‌ی مقالات</Link>
      <h1 className="text-2xl font-black leading-relaxed text-ink md:text-3xl">{String(row.title)}</h1>
      <p className="mt-2 text-[11.5px] text-body">
        {str(row.author_name) ? `نویسنده: ${str(row.author_name)} · ` : ""}
        {formatDate(row.published_at as string | null)}
      </p>
      {str(row.cover_url) ? <img src={str(row.cover_url)} alt={str(row.cover_alt) || str(row.title)} className="my-5 h-64 w-full rounded-2xl object-cover" /> : null}
      {str(row.excerpt) ? <p className="mb-4 rounded-xl bg-white p-4 text-[13.5px] font-medium leading-8 text-ink">{str(row.excerpt)}</p> : null}
      <div className="whitespace-pre-line text-[13.5px] leading-8 text-body">{String(row.body ?? "")}</div>
      <p className="mt-8 rounded-xl border border-ink/8 bg-white p-4 text-[11.5px] leading-6 text-body">
        این محتوا برای خودشناسی و رشد فردی است و جایگزین ارزیابی یا درمان تخصصی روان‌شناختی نیست.
      </p>
    </article>
  );
}

export function PublicPageView() {
  const { slug = "" } = useParams();
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(supabaseConfigured ? null : "این بخش هنوز به پایگاه داده متصل نیست.");
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabase || !slug) return;
    let cancelled = false;
    supabase
      .from("pages")
      .select("id,title,content,meta_description,published_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(friendlyError(err));
        else if (!data) setError("این صفحه یافت نشد یا هنوز منتشر نشده است.");
        else setRow(data as Record<string, unknown>);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <Loading />;
  if (error || !row) return <Notice>{error ?? "صفحه یافت نشد."}</Notice>;
  return (
    <>
      <PageHead title={String(row.title)} description={row.meta_description ? String(row.meta_description) : undefined} />
      <div className="rounded-2xl border border-ink/8 bg-white p-6 whitespace-pre-line text-[13.5px] leading-8 text-body">{String(row.content ?? "")}</div>
    </>
  );
}

export function PublicPsychologistsPage() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [error, setError] = useState<string | null>(supabaseConfigured ? null : "این بخش هنوز به پایگاه داده متصل نیست.");

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("psychologists")
      .select("id,display_name,title,bio,avatar_url,credentials_summary")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .order("display_name")
      .then(({ data, error: err }) => {
        if (err) setError(friendlyError(err));
        else setItems((data ?? []) as Record<string, unknown>[]);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <PageHead title="متخصصان آریاسازه" description="فقط متخصصانی که مدارک آن‌ها تأیید و پروفایلشان فعال شده است در این فهرست نمایش داده می‌شوند." />
      {loading ? <Loading /> : error ? <Notice>{error}</Notice> : items.length === 0 ? (
        <Notice>هنوز متخصص تأییدشده‌ای برای نمایش عمومی وجود ندارد.</Notice>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((p) => (
            <article key={String(p.id)} className="rounded-2xl border border-ink/8 bg-white p-4">
              <div className="mb-2 flex items-center gap-3">
                {p.avatar_url ? (
                  <img src={String(p.avatar_url)} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mist text-[13px] font-bold text-steel">{String(p.display_name).slice(0, 1)}</span>
                )}
                <div>
                  <h2 className="text-[13.5px] font-bold text-ink">{String(p.display_name)}</h2>
                  <p className="text-[11px] text-body">{String(p.title ?? "")}</p>
                </div>
              </div>
              {str(p.bio) ? <p className="line-clamp-4 text-[12px] leading-6 text-body">{str(p.bio)}</p> : null}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
