'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Send, Eye, Image as ImageIcon, Newspaper, Loader2,
  Plus, X, Building2, CheckSquare, Square, Search,
} from 'lucide-react';
import {
  companiesApi, articlesApi, newslettersApi, subscribersApi, unwrapList,
} from '@/lib/api';
import { buildLuxuryEmail } from '@/lib/buildLuxuryEmail';
import { logoForCompany, REY_CORPORATE_LOGO } from '@/lib/emailTemplates';

type ArticleCard = {
  id?: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  imageAlt?: string;
  url?: string;
};

const PAGE_SIZE = 40;

export default function NewNewsletterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [companyId, setCompanyId] = useState('');
  const [subject, setSubject] = useState('');
  const [eyebrow, setEyebrow] = useState('NEWSLETTER');
  const [heading, setHeading] = useState('This month from REY');
  const [body, setBody] = useState(
    'We are pleased to share the latest from across the REY Corporate Group — projects, opportunities and moments that matter.'
  );
  const [primaryButtonText, setPrimaryButtonText] = useState('EXPLORE REY');
  const [primaryButtonUrl, setPrimaryButtonUrl] = useState('https://www.reycorp.com.au');
  const [secondaryText, setSecondaryText] = useState('Thank you for staying connected with REY.');
  const [headerLogoUrl, setHeaderLogoUrl] = useState(REY_CORPORATE_LOGO);
  const [footerLogoUrl, setFooterLogoUrl] = useState(REY_CORPORATE_LOGO);
  const [headerBg, setHeaderBg] = useState('#0A2540');
  const [footerBg, setFooterBg] = useState('#f7f5f1');
  const [accentColor, setAccentColor] = useState('#B99A61');
  const [headingColor, setHeadingColor] = useState('#171717');
  const [bodyColor, setBodyColor] = useState('#444444');
  const [buttonBg, setButtonBg] = useState('#0A2540');
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
  const [companyFooter, setCompanyFooter] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageAlt, setHeroImageAlt] = useState('');
  const [articles, setArticles] = useState<ArticleCard[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  // Recipients
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [onlySubscribed, setOnlySubscribed] = useState(true);
  const [page, setPage] = useState(1);
  const [selectAllMatching, setSelectAllMatching] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.list();
      return unwrapList<any>(res.data);
    },
  });

  useEffect(() => {
    if (companies.length && !companyId) {
      const parent = companies.find((c: any) => c.is_parent) || companies[0];
      if (parent) setCompanyId(parent.id);
    }
  }, [companies, companyId]);

  const selectedCompany = useMemo(
    () => companies.find((c: any) => c.id === companyId),
    [companies, companyId]
  );

  // Branding switch with company
  useEffect(() => {
    if (!selectedCompany) return;
    const logo =
      selectedCompany.logo_url ||
      selectedCompany.external_logo_url ||
      logoForCompany(selectedCompany.slug || selectedCompany.name) ||
      REY_CORPORATE_LOGO;
    setHeaderLogoUrl(logo);
    setFooterLogoUrl(logo);
    if (selectedCompany.primary_color) {
      setHeaderBg(selectedCompany.primary_color);
      setButtonBg(selectedCompany.primary_color);
    }
    if (selectedCompany.secondary_color) setAccentColor(selectedCompany.secondary_color);
    setCompanyFooter(
      selectedCompany.brand_footer ||
        selectedCompany.footer_text ||
        (selectedCompany.is_parent
          ? selectedCompany.name
          : `${selectedCompany.name} — A Part of the REY Corporate Group.`)
    );
    if (selectedCompany.website) setPrimaryButtonUrl(selectedCompany.website);
  }, [selectedCompany]);

  const { data: publishedArticles = [] } = useQuery({
    queryKey: ['articles-published', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const res = await articlesApi.list({
          company: companyId,
          status: 'published',
          page_size: 50,
        } as any);
        return unwrapList<any>(res.data);
      } catch {
        return [];
      }
    },
    enabled: !!companyId,
  });

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['nl-subs', companyId, debouncedSearch, onlySubscribed, page],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: PAGE_SIZE,
        ordering: 'full_name',
      };
      if (companyId) params.company = companyId;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (onlySubscribed) params.is_subscribed = true;
      const res = await subscribersApi.list(params as any);
      const d = res.data as any;
      return {
        results: (d.results || d) as any[],
        count: d.count ?? (Array.isArray(d) ? d.length : 0),
      };
    },
    enabled: !!companyId,
  });

  const users = subsData?.results || [];
  const totalCount = subsData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageIds = users.map((u: any) => String(u.id));
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const companyName = selectedCompany?.name || 'Rey Corporate Group';

  const previewHtml = useMemo(() => {
    return buildLuxuryEmail({
      companyName,
      eyebrow,
      heading,
      body,
      bodyIsHtml: true,
      recipientName: 'Alex Thompson',
      primaryButtonText,
      primaryButtonUrl,
      secondaryText,
      subscribeUrl: '{{ subscribe_url }}',
      unsubscribeUrl: '{{ unsubscribe_url }}',
      headerLogoUrl,
      footerLogoUrl,
      headerBg,
      footerBg,
      companyFooter: companyFooter || undefined,
      accentColor,
      headingColor,
      bodyColor,
      buttonBg,
      buttonTextColor,
      heroImageUrl: heroImageUrl || undefined,
      heroImageAlt: heroImageAlt || heading,
      articles: articles.length ? articles : undefined,
    });
  }, [
    companyName, eyebrow, heading, body, primaryButtonText, primaryButtonUrl,
    secondaryText, headerLogoUrl, footerLogoUrl, headerBg, footerBg, companyFooter,
    accentColor, headingColor, bodyColor, buttonBg, buttonTextColor,
    heroImageUrl, heroImageAlt, articles,
  ]);

  const addArticleFromLibrary = (a: any) => {
    if (articles.some((x) => x.id === a.id)) return;
    const img =
      a.featured_image ||
      (typeof a.featured_image === 'string' ? a.featured_image : '') ||
      '';
    setArticles((prev) => [
      ...prev,
      {
        id: a.id,
        title: a.title,
        excerpt: a.excerpt || '',
        imageUrl: img,
        imageAlt: a.featured_image_alt || a.title,
        url: a.slug ? `#/articles/${a.slug}` : undefined,
      },
    ]);
  };

  const addManualArticle = () => {
    setArticles((prev) => [
      ...prev,
      {
        title: 'New article title',
        excerpt: 'Short description for the grid card.',
        imageUrl: '',
        url: 'https://www.reycorp.com.au',
      },
    ]);
  };

  const updateArticle = (index: number, patch: Partial<ArticleCard>) => {
    setArticles((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  };

  const removeArticle = (index: number) => {
    setArticles((prev) => prev.filter((_, i) => i !== index));
  };

  const onHeroFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setHeroImageUrl(reader.result);
        setHeroImageAlt(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const onArticleImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateArticle(index, { imageUrl: reader.result, imageAlt: file.name });
      }
    };
    reader.readAsDataURL(file);
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('Select a company');
      if (!subject.trim()) throw new Error('Subject is required');
      if (!selectAllMatching && selected.size === 0) {
        throw new Error('Select at least one recipient');
      }

      const html_content = buildLuxuryEmail({
        companyName: '{{ company.name }}',
        eyebrow,
        heading,
        body,
        bodyIsHtml: true,
        recipientName: '{{ full_name }}',
        primaryButtonText,
        primaryButtonUrl,
        secondaryText,
        subscribeUrl: '{{ subscribe_url }}',
        unsubscribeUrl: '{{ unsubscribe_url }}',
        headerLogoUrl,
        footerLogoUrl,
        headerBg,
        footerBg,
        companyFooter: companyFooter || undefined,
        accentColor,
        headingColor,
        bodyColor,
        buttonBg,
        buttonTextColor,
        heroImageUrl: heroImageUrl || undefined,
        heroImageAlt: heroImageAlt || heading,
        articles: articles.length ? articles : undefined,
      });

      const payload: Record<string, unknown> = {
        company: companyId,
        subject,
        html_content,
        status: 'draft',
        kind: 'newsletter',
      };
      // Prefer bulk-send style if API supports it
      if (selectAllMatching) {
        payload.select_all = true;
        payload.filters = {
          company: companyId,
          is_subscribed: onlySubscribed || undefined,
          search: debouncedSearch || undefined,
        };
      } else {
        payload.subscriber_ids = Array.from(selected);
      }

      // Try create then send if endpoint exists
      const created = await newslettersApi.create(payload as any);
      return created.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      setResultMsg('Campaign saved' + (data?.id ? ` (#${String(data.id).slice(0, 8)})` : ''));
      if (data?.id) {
        setTimeout(() => router.push(`/newsletters/${data.id}`), 800);
      }
    },
    onError: (err: any) => {
      setResultMsg(err?.response?.data?.detail || err?.message || 'Failed to save campaign');
    },
  });

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href="/newsletters"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Campaigns
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Design campaign / newsletter
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Live luxury preview · hero image · article grid · brand-aware
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            <Eye className="w-4 h-4" /> {showPreview ? 'Hide' : 'Show'} preview
          </button>
          <button
            type="button"
            disabled={sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium hover:bg-[#0A2540]/90 disabled:opacity-60"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Save campaign
          </button>
        </div>
      </div>

      {resultMsg && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {resultMsg}
        </div>
      )}

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* ── Designer ── */}
        <div className="space-y-4">
          {/* Company + subject */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Building2 className="w-3.5 h-3.5 inline mr-1" />
                Company
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_parent ? '(Parent)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. September update from REY"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Eyebrow</label>
                <input
                  value={eyebrow}
                  onChange={(e) => setEyebrow(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Heading</label>
                <input
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Button text</label>
                <input
                  value={primaryButtonText}
                  onChange={(e) => setPrimaryButtonText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Button URL</label>
                <input
                  value={primaryButtonUrl}
                  onChange={(e) => setPrimaryButtonUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Hero image */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#ad884b]">
                  Visual
                </div>
                <h2 className="text-sm font-semibold text-slate-900 mt-0.5">Hero image</h2>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Upload
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onHeroFile} />
            </div>
            <input
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="Or paste image URL…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
            {heroImageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImageUrl} alt={heroImageAlt || 'Hero'} className="w-full max-h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setHeroImageUrl('')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </section>

          {/* Article grid */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#ad884b]">
                  Content grid
                </div>
                <h2 className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4" /> Article grid
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  2-column cards in the email — pick published articles or add manually with images.
                </p>
              </div>
              <button
                type="button"
                onClick={addManualArticle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0A2540] text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Add card
              </button>
            </div>

            {publishedArticles.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-600 mb-2">From library</div>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                  {publishedArticles.map((a: any) => {
                    const added = articles.some((x) => x.id === a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        disabled={added}
                        onClick={() => addArticleFromLibrary(a)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                          added
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {a.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {articles.map((a, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 p-3 grid grid-cols-1 sm:grid-cols-[100px_1fr_auto] gap-3"
                >
                  <div className="space-y-1">
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.imageUrl}
                        alt=""
                        className="w-full h-20 object-cover rounded-lg border border-slate-100"
                      />
                    ) : (
                      <div className="w-full h-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <label className="block text-[10px] text-center text-slate-500 cursor-pointer hover:text-slate-700">
                      Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onArticleImage(i, e)}
                      />
                    </label>
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <input
                      value={a.title}
                      onChange={(e) => updateArticle(i, { title: e.target.value })}
                      placeholder="Title"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm"
                    />
                    <input
                      value={a.excerpt || ''}
                      onChange={(e) => updateArticle(i, { excerpt: e.target.value })}
                      placeholder="Excerpt"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                    <input
                      value={a.url || ''}
                      onChange={(e) => updateArticle(i, { url: e.target.value })}
                      placeholder="Link URL"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                    <input
                      value={a.imageUrl || ''}
                      onChange={(e) => updateArticle(i, { imageUrl: e.target.value })}
                      placeholder="Or image URL"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeArticle(i)}
                    className="self-start p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {articles.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  No articles yet — add cards or pick from the library above.
                </p>
              )}
            </div>
          </section>

          {/* Recipients */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Recipients</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={onlySubscribed}
                  onChange={(e) => setOnlySubscribed(e.target.checked)}
                />
                Subscribed only
              </label>
            </div>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const next = new Set(selected);
                  pageIds.forEach((id) => next.add(id));
                  setSelected(next);
                  setSelectAllMatching(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Page
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectAllMatching(true);
                  setSelected(new Set(pageIds));
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                All matching ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelected(new Set());
                  setSelectAllMatching(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Clear
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {subsLoading && (
                <div className="p-4 text-center text-xs text-slate-400">Loading…</div>
              )}
              {users.map((u: any) => {
                const id = String(u.id);
                const on = selected.has(id) || selectAllMatching;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelectAllMatching(false);
                      const next = new Set(selected);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      setSelected(next);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {on ? (
                      <CheckSquare className="w-4 h-4 text-[#0A2540]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                    <span className="font-medium text-slate-800 truncate">{u.full_name}</span>
                    <span className="text-xs text-slate-400 truncate ml-auto">{u.email}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>
                {selectAllMatching ? `All ${totalCount}` : `${selected.size} selected`}
              </span>
              <span>
                Page {page}/{totalPages}
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="ml-2 disabled:opacity-40"
                >
                  ‹
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="ml-1 disabled:opacity-40"
                >
                  ›
                </button>
              </span>
            </div>
          </section>
        </div>

        {/* ── Live preview ── */}
        {showPreview && (
          <div className="lg:sticky lg:top-6 self-start">
            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#ad884b] mb-2">
              Live preview
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#e9e8e4] shadow-sm overflow-hidden">
              <iframe
                title="Newsletter preview"
                srcDoc={previewHtml}
                className="w-full min-h-[720px] bg-white border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
