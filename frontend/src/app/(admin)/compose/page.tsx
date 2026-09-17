'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CheckSquare, Square, Send, Users, Building2,
  Mail, Calendar, Heart, Sparkles, Loader2, Search, AlertCircle,
  ChevronLeft, ChevronRight, Type, Eye, Tag,
} from 'lucide-react';
import { subscribersApi, companiesApi, newslettersApi, templatesApi, unwrapList } from '@/lib/api';
import { buildLuxuryEmail } from '@/lib/buildLuxuryEmail';
import {
  EMAIL_TEMPLATE_PRESETS,
  getTemplatePreset,
  logoForCompany,
  REY_CORPORATE_LOGO,
  type EmailTemplateType,
} from '@/lib/emailTemplates';

type EmailType =
  | 'thank_you_enquiry'
  | 'thank_you_registration'
  | 'thank_you_event'
  | 'invitation'
  | 'custom';

const EMAIL_TYPES: {
  id: EmailType;
  label: string;
  icon: typeof Mail;
  description: string;
}[] = [
  { id: 'invitation', label: 'Event Invitation', icon: Calendar, description: 'Invite guests to an event' },
  { id: 'thank_you_event', label: 'Thank You – Event', icon: Heart, description: 'Thank attendees after an event' },
  { id: 'thank_you_enquiry', label: 'Thank You – Enquiry', icon: Mail, description: 'Manual thank-you for enquiries' },
  { id: 'thank_you_registration', label: 'Thank You – Registration', icon: Sparkles, description: 'Welcome / registration thanks' },
  { id: 'custom', label: 'Custom Message', icon: Mail, description: 'Any other one-off email' },
];

const MERGE_TAGS = [
  { tag: '{{ full_name }}', label: 'Full name' },
  { tag: '{{ company.name }}', label: 'Company' },
  { tag: '{{ first_name }}', label: 'First name' },
];

const PAGE_SIZE = 50;

export default function ComposePage() {
  const [emailType, setEmailType] = useState<EmailType>('thank_you_event');
  const [savedTemplateId, setSavedTemplateId] = useState<string>('');
  const [companyId, setCompanyId] = useState('');
  const [sendAsParent, setSendAsParent] = useState(false);
  const [subject, setSubject] = useState('');
  const [eyebrow, setEyebrow] = useState('');
  const [heading, setHeading] = useState('');
  const [body, setBody] = useState('');
  const [primaryButtonText, setPrimaryButtonText] = useState('VISIT REY');
  const [primaryButtonUrl, setPrimaryButtonUrl] = useState('https://www.reycorp.com.au');
  const [secondaryText, setSecondaryText] = useState('');
  const [subscribeUrl, setSubscribeUrl] = useState('{{ subscribe_url }}');
  const [unsubscribeUrl, setUnsubscribeUrl] = useState('{{ unsubscribe_url }}');
  const [headerLogoUrl, setHeaderLogoUrl] = useState('');
  const [footerLogoUrl, setFooterLogoUrl] = useState('');
  const [headerBg, setHeaderBg] = useState('#0A2540');
  const [footerBg, setFooterBg] = useState('#f7f5f1');
  const [accentColor, setAccentColor] = useState('#B99A61');
  const [headingColor, setHeadingColor] = useState('#171717');
  const [bodyColor, setBodyColor] = useState('#444444');
  const [buttonBg, setButtonBg] = useState('#111111');
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
  const [companyFooter, setCompanyFooter] = useState('');
  const [headerLogoWidth, setHeaderLogoWidth] = useState(140);
  const [footerLogoWidth, setFooterLogoWidth] = useState(100);
  
  const { data: savedTemplates = [] } = useQuery({
    queryKey: ['compose-templates', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await templatesApi.list({ company: companyId, is_active: true });
      const d = res.data as any;
      return unwrapList<any>(d);
    },
    enabled: !!companyId,
  });

  const applySavedTemplate = (id: string) => {
    setSavedTemplateId(id);
    if (!id) return;
    templatesApi.get(String(id)).then((res) => {
      const full = res.data as any;
      if (full.type) setEmailType(full.type as EmailType);
      if (full.subject) setSubject(full.subject);
      if (full.preheader) setEyebrow(full.preheader);

      const ls = full.logo_settings || {};
      const d = ls.design || {};

      // Your saved custom fields (persist across reload)
      if (d.eyebrow) setEyebrow(d.eyebrow);
      else if (full.preheader) setEyebrow(full.preheader);
      if (d.heading) setHeading(d.heading);
      if (d.body) setBody(d.body);
      if (d.buttonText) setPrimaryButtonText(d.buttonText);
      if (d.buttonUrl) setPrimaryButtonUrl(d.buttonUrl);
      if (d.companyFooter) setCompanyFooter(d.companyFooter);

      if (d.accentColor) setAccentColor(d.accentColor);
      else if (full.secondary_color) setAccentColor(full.secondary_color);
      if (d.headingColor) setHeadingColor(d.headingColor);
      if (d.bodyColor) setBodyColor(d.bodyColor);
      if (d.buttonBg) setButtonBg(d.buttonBg);
      else if (full.primary_color) setButtonBg(full.primary_color);
      if (d.buttonTextColor) setButtonTextColor(d.buttonTextColor);
      if (d.headerBg || full.header_bg) setHeaderBg(d.headerBg || full.header_bg);
      if (d.footerBg || full.footer_bg) setFooterBg(d.footerBg || full.footer_bg);
      if (d.headerLogoWidth || ls.headerWidth) setHeaderLogoWidth(Number(d.headerLogoWidth || ls.headerWidth) || 140);
      if (d.footerLogoWidth || ls.footerWidth) setFooterLogoWidth(Number(d.footerLogoWidth || ls.footerWidth) || 100);

      const hLogo = full.header_logo_url || ls.headerUrl || '';
      const fLogo = full.footer_logo_url || ls.footerUrl || '';
      if (hLogo) setHeaderLogoUrl(hLogo);
      if (fLogo) setFooterLogoUrl(fLogo);

      setResultMsg('Loaded saved template: ' + (full.name || 'Template'));
    }).catch(() => {
      setResultMsg('Could not load template details');
    });
  };

const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [onlySubscribed, setOnlySubscribed] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('');
  const [ordering, setOrdering] = useState('full_name');
  const [page, setPage] = useState(1);
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Load preset when type changes
  const applyPreset = (type: EmailType) => {
    const preset = getTemplatePreset(type as EmailTemplateType);
    setSavedTemplateId(''); // leave saved template — using built-in preset
    setEmailType(type);
    setSubject(preset.subject);
    setEyebrow(preset.eyebrow);
    setHeading(preset.heading);
    setBody(preset.body);
    setPrimaryButtonText(preset.primaryButtonText || 'VISIT REY');
    setSecondaryText(preset.secondaryText || '');
    setHeaderLogoUrl('');
    setFooterLogoUrl('');
    setHeaderBg('#0A2540');
    setFooterBg('#f7f5f1');
    setAccentColor('#B99A61');
    setHeadingColor('#171717');
    setBodyColor('#444444');
    setButtonBg('#111111');
    setButtonTextColor('#ffffff');
    setResultMsg(null);
  };

  useEffect(() => {
    applyPreset('thank_you_event');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSelectAllMatching(false);
  }, [companyId, onlySubscribed, sourceFilter, ordering]);

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.list();
      const d = res.data;
      return unwrapList<any>(d);
    },
  });

  const { data: subsData, isLoading: subsLoading, error: subsError } = useQuery({
    queryKey: ['subscribers-compose', companyId, debouncedSearch, onlySubscribed, sourceFilter, page, ordering],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: PAGE_SIZE,
        ordering,
      };
      if (companyId) params.company = companyId;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (onlySubscribed) params.is_subscribed = true;
      if (sourceFilter) params.source = sourceFilter;
      const res = await subscribersApi.list(params as any);
      const d = res.data;
      return {
        results: (d.results || d) as any[],
        count: d.count ?? (Array.isArray(d) ? d.length : 0),
      };
    },
  });

  const users = subsData?.results || [];
  const totalCount = subsData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const selectedCompany = useMemo(
    () => companies.find((c: any) => c.id === companyId),
    [companies, companyId]
  );

  const companyName = sendAsParent
    ? 'Rey Corporate Group'
    : selectedCompany?.name || 'Rey Corporate Group';

  useEffect(() => {
    if (companies.length && !companyId) {
      const parent = companies.find((c: any) => c.is_parent) || companies[0];
      if (parent) setCompanyId(parent.id);
    }
  }, [companies, companyId]);

  // When company (or "send as parent") changes, switch logo + brand tokens consistently
  // across the whole REY Corporate Group — one template logic, company-specific branding.
  useEffect(() => {
    if (!selectedCompany) return;

    const useParentBrand = sendAsParent || selectedCompany.is_parent;
    const brandCompany = useParentBrand
      ? (companies.find((c: any) => c.is_parent) || selectedCompany)
      : selectedCompany;

    // Prefer live API logo (upload or external_logo_url), fall back to official CDN map
    const logo =
      brandCompany.logo_url ||
      brandCompany.external_logo_url ||
      logoForCompany(brandCompany.slug || brandCompany.name) ||
      REY_CORPORATE_LOGO;

    setHeaderLogoUrl(logo);
    setFooterLogoUrl(logo);

    // Brand colours from company record (seeded from COMPANY_BRANDS)
    if (brandCompany.primary_color) {
      setHeaderBg(brandCompany.primary_color);
      setButtonBg(brandCompany.primary_color);
    }
    if (brandCompany.secondary_color) {
      setAccentColor(brandCompany.secondary_color);
    }
    if (brandCompany.accent_color) {
      // keep as secondary accent if present
    }

    // Consistent group footer line
    const footer =
      brandCompany.brand_footer ||
      brandCompany.footer_text ||
      (brandCompany.is_parent
        ? brandCompany.name
        : `${brandCompany.name} — A Part of the REY Corporate Group.`);
    setCompanyFooter(footer);

    // Website / CTA defaults for this brand
    if (brandCompany.website) {
      setPrimaryButtonUrl(brandCompany.website);
    }
    // Always use send-time merge tags so subscribe registers users & unsubscribe is one-click
    setSubscribeUrl("{{ subscribe_url }}");
    setUnsubscribeUrl("{{ unsubscribe_url }}");

    // Clear any previously loaded per-company saved template so group presets apply
    setSavedTemplateId('');
  }, [companyId, sendAsParent, selectedCompany, companies]);

  const pageIds = users.map((u: any) => String(u.id));
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const selectAllOnPage = () => {
    const next = new Set(selected);
    pageIds.forEach((id) => next.add(id));
    setSelected(next);
    setSelectAllMatching(false);
  };

  const selectNone = () => {
    setSelected(new Set());
    setSelectAllMatching(false);
  };

  const selectAllMatchingFilter = () => {
    setSelectAllMatching(true);
    setSelected(new Set(pageIds));
  };

  const toggle = (id: string) => {
    setSelectAllMatching(false);
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  // Insert merge tag at cursor in body
  const insertTag = (tag: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => b + tag);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = body.slice(0, start) + tag + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + tag.length;
      el.setSelectionRange(pos, pos);
    });
  };

  // Live luxury HTML preview
  const previewHtml = useMemo(() => {
    return buildLuxuryEmail({
      companyName,
      eyebrow: eyebrow || 'MESSAGE',
      heading: heading || subject || 'A message from our team',
      body: body || 'Your message will appear here.',
      recipientName: 'Alex Thompson',
      recipientEmail: 'alex.thompson@example.com',
      primaryButtonText: primaryButtonText || undefined,
      primaryButtonUrl: primaryButtonUrl || undefined,
      secondaryText: secondaryText || undefined,
      subscribeUrl: subscribeUrl || undefined,
      unsubscribeUrl: unsubscribeUrl || '#',
      headerLogoUrl: headerLogoUrl || undefined,
      footerLogoUrl: footerLogoUrl || undefined,
      headerBg,
      footerBg,
      companyFooter: companyFooter || undefined,
      headerLogoWidth,
      footerLogoWidth,
      bodyIsHtml: true,
      accentColor,
      headingColor,
      bodyColor,
      buttonBg,
      buttonTextColor,
    });
  }, [companyName, eyebrow, heading, subject, body, primaryButtonText, primaryButtonUrl, secondaryText, subscribeUrl, unsubscribeUrl, headerLogoUrl, footerLogoUrl, headerBg, footerBg, companyFooter, headerLogoWidth, footerLogoWidth, accentColor, headingColor, bodyColor, buttonBg, buttonTextColor]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('Select a company');
      if (!selectAllMatching && selected.size === 0) {
        throw new Error('Select at least one recipient');
      }

      // Build the same luxury HTML that the preview shows
      // Backend still substitutes {{ full_name }} etc.
      const html_content = buildLuxuryEmail({
        companyName: sendAsParent ? 'Rey Corporate Group' : '{{ company.name }}',
        eyebrow: eyebrow || 'MESSAGE',
        heading: heading || subject,
        body: body,
        recipientName: '{{ full_name }}',
        recipientEmail: '{{ email }}',
        primaryButtonText: primaryButtonText || undefined,
        primaryButtonUrl: primaryButtonUrl || undefined,
        secondaryText: secondaryText || undefined,
        subscribeUrl: subscribeUrl || undefined,
        unsubscribeUrl: unsubscribeUrl || '{{ unsubscribe_url }}',
        headerLogoUrl: headerLogoUrl || undefined,
        footerLogoUrl: footerLogoUrl || undefined,
        headerBg,
        footerBg,
        companyFooter: companyFooter || undefined,
        headerLogoWidth,
        footerLogoWidth,
        bodyIsHtml: true,
        accentColor,
        headingColor,
        bodyColor,
        buttonBg,
        buttonTextColor,
      });

      const payload: Record<string, unknown> = {
        company_id: companyId,
        send_as_parent: sendAsParent,
        email_type: emailType,
        subject,
        html_content,
        plain_text: body,
        select_all: selectAllMatching,
        filter_is_subscribed: onlySubscribed,
        send_immediately: true,
      };

      if (selectAllMatching) {
        payload.subscriber_ids = [];
        if (sourceFilter) payload.filter_source = sourceFilter;
        if (debouncedSearch) payload.filter_search = debouncedSearch;
      } else {
        payload.subscriber_ids = Array.from(selected);
      }

      const res = await newslettersApi.manualSend(payload);
      return res.data;
    },
    onSuccess: (data: any) => {
      const n = data?.total_recipients ?? (selectAllMatching ? totalCount : selected.size);
      setResultMsg(
        data?.message ||
          (data?.queued
            ? `Queued ${n} email(s). Sending in background — safe to leave this page.`
            : `Sent ${data?.sent ?? n} email(s).`)
      );
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        'Send failed';
      setResultMsg(`Error: ${msg}`);
    },
  });

  const recipientLabel = selectAllMatching
    ? `all ${totalCount.toLocaleString()} matching`
    : `${selected.size} selected`;

  const pageNumbers = (() => {
    const pages: (number | '…')[] = [];
    const max = totalPages;
    if (max <= 5) {
      for (let i = 1; i <= max; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(max - 1, page + 1); i++) pages.push(i);
    if (page < max - 2) pages.push('…');
    pages.push(max);
    return pages;
  })();

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compose</h1>
          <p className="text-slate-500 mt-1">
            Luxury templates · Live preview · Merge tags · Send
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
          <button
            onClick={() => sendMutation.mutate()}
            disabled={
              sendMutation.isPending ||
              !companyId ||
              (!selectAllMatching && selected.size === 0)
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A2540] text-white rounded-xl text-sm font-medium hover:bg-[#0A2540]/90 shadow-sm disabled:opacity-50"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send to {recipientLabel}
          </button>
        </div>

      {/* Saved template from Template Builder */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Saved template (optional)
        </label>
        <p className="text-xs text-slate-400 mt-1 mb-3">
          Pick a template you designed in Email Templates → Builder. Leave empty to use the type presets above.
        </p>
        <select
          value={savedTemplateId}
          onChange={(e) => applySavedTemplate(e.target.value)}
          disabled={!companyId}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#b99a61]"
        >
          <option value="">— Use type preset only —</option>
          {savedTemplates.map((tpl: any) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name}{tpl.type ? ` (${tpl.type})` : ''}
            </option>
          ))}
        </select>
        {!companyId && (
          <p className="text-xs text-amber-600 mt-2">Select a company first to load its templates.</p>
        )}
      </div>

      </div>

      {resultMsg && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            resultMsg.startsWith('Error') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {resultMsg}
        </div>
      )}

      {/* Template type cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {EMAIL_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyPreset(t.id)}
            className={`p-4 rounded-2xl border text-left transition ${
              emailType === t.id
                ? 'border-[#0A2540] bg-[#0A2540]/5 ring-2 ring-[#0A2540]/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <t.icon className={`w-5 h-5 mb-2 ${emailType === t.id ? 'text-[#0A2540]' : 'text-slate-400'}`} />
            <div className="text-sm font-semibold text-slate-900">{t.label}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t.description}</div>
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 gap-6 ${showPreview ? 'xl:grid-cols-12' : 'lg:grid-cols-3'}`}>
        {/* LEFT — Editor */}
        <div className={`space-y-4 ${showPreview ? 'xl:col-span-5' : 'lg:col-span-2'}`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Type className="w-4 h-4" />
              Content
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Building2 className="w-3.5 h-3.5 inline mr-1" />
                Company
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={companiesLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
              >
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_parent ? '(Parent)' : ''}
                  </option>
                ))}
              </select>
              {selectedCompany?.is_parent === false && (
                <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={sendAsParent}
                    onChange={(e) => setSendAsParent(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Brand as parent (REY Corporate Group) instead
                </label>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
              />
            </div>

            {/* Eyebrow + Heading */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Eyebrow <span className="text-slate-400 font-normal">(small label)</span>
                </label>
                <input
                  value={eyebrow}
                  onChange={(e) => setEyebrow(e.target.value)}
                  placeholder="THANK YOU"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Heading</label>
                <input
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="We have received your enquiry."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
                />
              </div>
            </div>

            {/* Body + merge tags */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Message body</label>
                <div className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {MERGE_TAGS.map((m) => (
                    <button
                      key={m.tag}
                      type="button"
                      onClick={() => insertTag(m.tag)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-[#0A2540]/10 hover:text-[#0A2540] transition"
                      title={`Insert ${m.tag}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20 resize-y"
                placeholder="Write your message… Use the tags above to personalise."
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Click a tag to insert at cursor. Logo header + gold footer are automatic.
              </p>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Button label</label>
                <input
                  value={primaryButtonText}
                  onChange={(e) => setPrimaryButtonText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Button URL</label>
                <input
                  value={primaryButtonUrl}
                  onChange={(e) => setPrimaryButtonUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Secondary line <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                value={secondaryText}
                onChange={(e) => setSecondaryText(e.target.value)}
                placeholder="We look forward to speaking with you."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Subscribe URL
                </label>
                <input
                  value={subscribeUrl}
                  onChange={(e) => setSubscribeUrl(e.target.value)}
                  placeholder="https://www.reycorp.com.au"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Unsubscribe URL
                </label>
                <input
                  value={unsubscribeUrl}
                  onChange={(e) => setUnsubscribeUrl(e.target.value)}
                  placeholder="{{ unsubscribe_url }}"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Use {'{{ unsubscribe_url }}'} for per-recipient links from the backend.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE — Live luxury preview */}
        {showPreview && (
          <div className="xl:col-span-4">
            <div className="sticky top-4">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white">
                <div className="bg-[#0A2540] px-4 py-2.5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C9A227]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  <span className="ml-2 text-[10px] tracking-widest text-[#C9A227] uppercase">
                    Live luxury preview
                  </span>
                </div>
                <div className="max-h-[70vh] overflow-y-auto bg-[#f4f4f7]">
                  <iframe
                    title="Email preview"
                    srcDoc={previewHtml}
                    className="w-full border-0"
                    style={{ minHeight: 640, height: 720 }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT — Recipients */}
        <div className={`${showPreview ? 'xl:col-span-3' : 'lg:col-span-1'}`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col min-h-[560px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4" /> Recipients
              </h2>
              <span className="text-xs font-medium text-[#0A2540] bg-[#0A2540]/10 px-2.5 py-1 rounded-full">
                {selectAllMatching
                  ? `All ${totalCount.toLocaleString()}`
                  : `${selected.size} selected`}
              </span>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={onlySubscribed}
                  onChange={(e) => setOnlySubscribed(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Subscribed only
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white"
              >
                <option value="">All sources</option>
                <option value="import">Import</option>
                <option value="manual">Manual</option>
                <option value="website">Website</option>
                <option value="enquiry">Enquiry</option>
              </select>
              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white"
              >
                <option value="full_name">Name A–Z</option>
                <option value="-full_name">Name Z–A</option>
                <option value="email">Email A–Z</option>
                <option value="-created_at">Newest</option>
                <option value="created_at">Oldest</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                type="button"
                onClick={selectAllOnPage}
                disabled={users.length === 0}
                className={`text-xs py-1.5 px-2.5 rounded-lg border font-medium transition disabled:opacity-40 ${
                  allOnPageSelected && !selectAllMatching
                    ? 'bg-[#0A2540] text-white border-[#0A2540]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                This page
              </button>
              <button
                type="button"
                onClick={selectAllMatchingFilter}
                disabled={totalCount === 0}
                className={`text-xs py-1.5 px-2.5 rounded-lg border font-medium transition disabled:opacity-40 ${
                  selectAllMatching
                    ? 'bg-[#0A2540] text-white border-[#0A2540]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                All matching
              </button>
              <button
                type="button"
                onClick={selectNone}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium"
              >
                Clear
              </button>
            </div>

            {subsError && (
              <div className="flex items-center gap-2 text-rose-600 text-xs mb-2">
                <AlertCircle className="w-4 h-4" />
                Failed to load subscribers
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-1 min-h-[280px]">
              {subsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No recipients found</p>
              ) : (
                users.map((u: any) => {
                  const id = String(u.id);
                  const isSelected = selected.has(id) || selectAllMatching;
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition ${
                        isSelected ? 'bg-[#0A2540]/5' : 'hover:bg-slate-50'
                      }`}
                    >
                      <button type="button" onClick={() => toggle(id)} className="shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#0A2540]" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 truncate">{u.full_name}</div>
                        <div className="text-xs text-slate-500 truncate">{u.email}</div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || subsLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-0.5 flex-wrap justify-center">
                  {pageNumbers.map((n, i) =>
                    n === '…' ? (
                      <span key={`e${i}`} className="px-1 text-slate-400 text-xs">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPage(n as number)}
                        className={`min-w-[28px] h-7 rounded-md text-xs font-medium ${
                          page === n
                            ? 'bg-[#0A2540] text-white'
                            : 'border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  disabled={page >= totalPages || subsLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1 text-center">
              Page {page} of {totalPages} · {PAGE_SIZE} per page
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
