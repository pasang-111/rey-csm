"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  ArrowLeft,
  Eye,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  companiesApi,
  templatesApi,
} from "@/lib/api";

import {
  EMAIL_TEMPLATE_PRESETS,
  EmailTemplateType,
  REY_CORPORATE_WEBSITE,
  getTemplatePreset,
} from "@/lib/emailTemplates";

import {
  buildLuxuryEmail,
} from "@/lib/buildLuxuryEmail";
import { LogoUpload } from "@/components/templates/LogoUpload";
import { RichTextEditor } from "@/components/templates/RichTextEditor";


export default function TemplateBuilderPage() {
  const queryClient = useQueryClient();

  const searchParams = useSearchParams();

  const requestedType =
    searchParams.get("type") as
      | EmailTemplateType
      | null;
  const requestedId = searchParams.get("id");

  const [companyId, setCompanyId] =
    useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [headerLogoUrl, setHeaderLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [headerLogoWidth, setHeaderLogoWidth] = useState(140);
  const [footerLogoWidth, setFooterLogoWidth] = useState(100);
  const [headerBg, setHeaderBg] = useState("#0A2540");
  const [footerBg, setFooterBg] = useState("#f7f5f1");
  const [accentColor, setAccentColor] = useState("#B99A61");
  const [headingColor, setHeadingColor] = useState("#171717");
  const [bodyColor, setBodyColor] = useState("#444444");
  const [buttonBg, setButtonBg] = useState("#111111");
  const [buttonTextColor, setButtonTextColor] = useState("#ffffff");
  const [companyFooter, setCompanyFooter] = useState("");
  const [subscribeUrl, setSubscribeUrl] = useState("{{ subscribe_url }}");
  const [unsubscribeUrl, setUnsubscribeUrl] = useState("{{ unsubscribe_url }}");
  const [showSubscribeBlock, setShowSubscribeBlock] = useState(true);

  const [name, setName] =
    useState("Luxury Enquiry Thank You");

  const [type, setType] =
    useState<EmailTemplateType>(
      requestedType || "thank_you_enquiry"
    );

  const [subject, setSubject] =
    useState(
      "Thank you for contacting {{ company.name }}"
    );

  const [eyebrow, setEyebrow] =
    useState("THANK YOU");

  const [heading, setHeading] =
    useState(
      "We have received your enquiry."
    );

  const [body, setBody] =
    useState(
      "Thank you for reaching out to {{ company.name }}. Our team has received your enquiry and will be in touch shortly."
    );

  const [buttonText, setButtonText] =
    useState("VISIT REY");

  const [buttonUrl, setButtonUrl] =
    useState(REY_CORPORATE_WEBSITE);

  const [recipientName, setRecipientName] =
    useState("James Wilson");

  const [eventName, setEventName] =
    useState("REY Private Evening");

  const [eventDate, setEventDate] =
    useState("Friday, 24 October 2026");

  const [eventTime, setEventTime] =
    useState("6:30 PM");

  const [eventLocation, setEventLocation] =
    useState(
      "REY Corporate Group, Sydney"
    );

  const [isDefault, setIsDefault] =
    useState(true);


  /*
   * COMPANIES
   */

  const {
    data: companies,
    isLoading: companiesLoading,
  } = useQuery({
    queryKey: ["companies"],

    queryFn: async () => {
      const response =
        await companiesApi.list();

      const data = response.data;

      return (
        data.results || data
      ) as any[];
    },
  });


  /*
   * INITIAL COMPANY
   */

  useEffect(() => {
    if (
      companies?.length &&
      !companyId
    ) {
      setCompanyId(
        companies[0].id
      );
    }
  }, [
    companies,
    companyId,
  ]);


  /*
   * SELECTED COMPANY
   */

  const selectedCompany =
    useMemo(() => {
      return (
        companies || []
      ).find(
        (company: any) =>
          company.id === companyId
      );
    }, [
      companies,
      companyId,
    ]);

  useEffect(() => {
    if (selectedCompany) {
      setCompanyFooter(
        selectedCompany.brand_footer ||
        selectedCompany.footer_text ||
        (selectedCompany.is_parent
          ? selectedCompany.name
          : `${selectedCompany.name} — A Part of the REY Corporate Group.`)
      );
      if (selectedCompany.primary_color) setHeaderBg(selectedCompany.primary_color);
      // Keep merge tags so send-time injection works; preview uses fallbacks
      setSubscribeUrl("{{ subscribe_url }}");
      setUnsubscribeUrl("{{ unsubscribe_url }}");
    }
  }, [selectedCompany]);




  /*
   * LOAD EXISTING TEMPLATE (?id=)
   */
  useEffect(() => {
    if (!requestedId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await templatesApi.get(requestedId);
        if (cancelled) return;
        const tpl = res.data as any;
        setTemplateId(String(tpl.id));
        if (tpl.company) setCompanyId(String(tpl.company));
        if (tpl.name) setName(tpl.name);
        if (tpl.type) setType(tpl.type);
        if (tpl.subject) setSubject(tpl.subject);
        if (tpl.is_default != null) setIsDefault(!!tpl.is_default);
        if (tpl.header_bg) setHeaderBg(tpl.header_bg);
        if (tpl.footer_bg) setFooterBg(tpl.footer_bg);
        if (tpl.header_logo_url) setHeaderLogoUrl(tpl.header_logo_url);
        if (tpl.footer_logo_url) setFooterLogoUrl(tpl.footer_logo_url);
        const ls = tpl.logo_settings || {};
        if (ls.headerUrl) setHeaderLogoUrl(ls.headerUrl);
        if (ls.footerUrl) setFooterLogoUrl(ls.footerUrl);
        if (ls.headerWidth) setHeaderLogoWidth(Number(ls.headerWidth) || 140);
        if (ls.footerWidth) setFooterLogoWidth(Number(ls.footerWidth) || 100);
        const d = ls.design || {};
        if (d.eyebrow || tpl.preheader) setEyebrow(d.eyebrow || tpl.preheader || "");
        if (d.heading) setHeading(d.heading);
        if (d.body) setBody(d.body);
        if (d.buttonText) setButtonText(d.buttonText);
        if (d.buttonUrl) setButtonUrl(d.buttonUrl);
        if (d.accentColor) setAccentColor(d.accentColor);
        if (d.headingColor) setHeadingColor(d.headingColor);
        if (d.bodyColor) setBodyColor(d.bodyColor);
        if (d.buttonBg) setButtonBg(d.buttonBg);
        if (d.buttonTextColor) setButtonTextColor(d.buttonTextColor);
        if (d.headerBg) setHeaderBg(d.headerBg);
        if (d.footerBg) setFooterBg(d.footerBg);
        if (d.companyFooter) setCompanyFooter(d.companyFooter);
        if (d.eventName) setEventName(d.eventName);
        if (d.eventDate) setEventDate(d.eventDate);
        if (d.eventTime) setEventTime(d.eventTime);
        if (d.eventLocation) setEventLocation(d.eventLocation);
        if (d.subscribeUrl != null) setSubscribeUrl(d.subscribeUrl);
        if (d.unsubscribeUrl != null) setUnsubscribeUrl(d.unsubscribeUrl);
        if (d.showSubscribeBlock != null) setShowSubscribeBlock(!!d.showSubscribeBlock);
        if (tpl.secondary_color) setAccentColor(tpl.secondary_color);
        if (tpl.primary_color) setButtonBg(tpl.primary_color);
      } catch (e) {
        console.error("Failed to load template", e);
      }
    })();
    return () => { cancelled = true; };
  }, [requestedId]);

  /*
   * CHANGE TEMPLATE
   */

  function changeTemplate(
    nextType: EmailTemplateType
  ) {
    const template =
      getTemplatePreset(nextType);

    setType(nextType);

    setName(template.name);

    setSubject(
      template.subject
    );

    setEyebrow(
      template.eyebrow
    );

    setHeading(
      template.heading
    );

    setBody(
      template.body
    );

    setButtonText(
      template.primaryButtonText
    );
  }


  /*
   * KEEP QUERY TYPE IN SYNC
   */

  useEffect(() => {
    if (requestedType) {
      changeTemplate(
        requestedType
      );
    }
  }, [requestedType]);


  /*
   * ACTIVE PRESET
   */

  const preset =
    useMemo(
      () =>
        getTemplatePreset(type),
      [type]
    );


  /* Header & footer logos are customisable via upload below. */


  /*
   * LIVE PREVIEW
   */

  const previewHtml =
    useMemo(() => {

      const companyName =
        selectedCompany?.name ||
        "REY Corporate Group";

      const replaceVariables =
        (value: string) => {

          return value
            .replace(
              /\{\{\s*company\.name\s*\}\}/g,
              companyName
            )
            .replace(
              /\{\{\s*full_name\s*\}\}/g,
              recipientName
            )
            .replace(
              /\{\{\s*event\.name\s*\}\}/g,
              eventName
            );
        };


      return buildLuxuryEmail({
        companyName,

        eyebrow:
          replaceVariables(
            eyebrow
          ),

        heading:
          replaceVariables(
            heading
          ),

        body:
          replaceVariables(
            body
          ),

        recipientName,

        eventName:
          preset.showEventDetails
            ? eventName
            : undefined,

        eventDate:
          preset.showEventDetails
            ? eventDate
            : undefined,

        eventTime:
          preset.showEventDetails
            ? eventTime
            : undefined,

        eventLocation:
          preset.showEventDetails
            ? eventLocation
            : undefined,

        primaryButtonText:
          preset.showButton
            ? buttonText
            : undefined,

        primaryButtonUrl:
          preset.showButton
            ? buttonUrl
            : undefined,

        secondaryText:
          preset.secondaryText,

        subscribeUrl: showSubscribeBlock
          ? (subscribeUrl === "{{ subscribe_url }}"
              ? `https://example.com/subscribe/?company=${selectedCompany?.slug || "rey-corporate-group"}`
              : subscribeUrl)
          : undefined,
        unsubscribeUrl: showSubscribeBlock
          ? (unsubscribeUrl === "{{ unsubscribe_url }}"
              ? "https://example.com/unsubscribe/preview-token/"
              : unsubscribeUrl)
          : undefined,

        headerLogoUrl: headerLogoUrl || undefined,
        footerLogoUrl: footerLogoUrl || undefined,
        headerBg,
        footerBg,
        companyFooter: companyFooter || selectedCompany?.brand_footer || selectedCompany?.footer_text || undefined,
        headerLogoWidth,
        footerLogoWidth,
        bodyIsHtml: true,
        accentColor,
        headingColor,
        bodyColor,
        buttonBg,
        buttonTextColor,
      });

    }, [
      selectedCompany,
      eyebrow,
      heading,
      body,
      recipientName,
      eventName,
      eventDate,
      eventTime,
      eventLocation,
      buttonText,
      buttonUrl,
      preset,
      headerLogoUrl,
      footerLogoUrl,
      headerBg,
      footerBg,
      companyFooter,
      headerLogoWidth,
      footerLogoWidth,
    ]);


  /*
   * SAVE
   */

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) {
        throw new Error("Select a company first");
      }

      // Store Django-compatible HTML with template variables
      const html_body = buildLuxuryEmail({
        companyName: "{{ company.name }}",
        eyebrow: "{{ email_eyebrow }}",
        heading: "{{ email_heading }}",
        body: "{{ body_content|safe }}",
        recipientName: "{{ full_name }}",
        eventName: "{{ event.name }}",
        eventDate: "{{ event.date }}",
        eventTime: "{{ event.time }}",
        eventLocation: "{{ event.location }}",
        primaryButtonText: "{{ cta_text }}",
        primaryButtonUrl: "{{ cta_url }}",
        secondaryText: "{{ email_secondary }}",
        subscribeUrl: showSubscribeBlock ? (subscribeUrl || "{{ subscribe_url }}") : undefined,
        unsubscribeUrl: showSubscribeBlock ? (unsubscribeUrl || "{{ unsubscribe_url }}") : undefined,
        headerLogoUrl: headerLogoUrl || undefined,
        footerLogoUrl: footerLogoUrl || undefined,
        headerBg,
        footerBg,
        companyFooter: companyFooter || "{{ company_footer }}",
        headerLogoWidth,
        footerLogoWidth,
        bodyIsHtml: true,
        accentColor,
        headingColor,
        bodyColor,
        buttonBg,
        buttonTextColor,
      });

      const payload = {
        company: companyId,
        name,
        type,
        subject,
        preheader: eyebrow,
        html_body,
        primary_color: buttonBg || "#111111",
        secondary_color: accentColor || "#B99A61",
        header_bg: headerBg,
        footer_bg: footerBg,
        logo_settings: {
          headerUrl: headerLogoUrl || "",
          footerUrl: footerLogoUrl || "",
          headerWidth: headerLogoWidth,
          footerWidth: footerLogoWidth,
          align: "center",
          // Persisted editable design so Compose + reload keep your changes
          design: {
            eyebrow,
            heading,
            body,
            buttonText,
            buttonUrl,
            accentColor,
            headingColor,
            bodyColor,
            buttonBg,
            buttonTextColor,
            headerBg,
            footerBg,
            companyFooter,
            eventName,
            eventDate,
            eventTime,
            eventLocation,
            subscribeUrl,
            unsubscribeUrl,
            showSubscribeBlock,
          },
        },
        is_default: isDefault,
        is_active: true,
      };

      if (templateId) {
        return templatesApi.update(templateId, payload);
      }
      return templatesApi.create(payload);
    },
    onSuccess: (res: any) => {
      const id = res?.data?.id;
      if (id) setTemplateId(id);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      alert("Luxury REY email template saved.");
    },
  });


  return (
    <div
      className="
        min-h-screen
        space-y-7
      "
    >


      {/* HEADER */}

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-4
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <Link
            href="/templates"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-slate-200
              bg-white
              text-slate-500
              transition
              hover:bg-slate-50
            "
          >
            <ArrowLeft
              className="h-4 w-4"
            />
          </Link>


          <div>

            <div
              className="
                flex
                items-center
                gap-2
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.3em]
                text-[#ad884b]
              "
            >

              <Sparkles
                className="h-3 w-3"
              />

              REY COMMUNICATIONS

            </div>


            <h1
              className="
                mt-1
                font-serif
                text-3xl
                font-normal
                text-slate-900
              "
            >
              Luxury Email Studio
            </h1>


            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Select a finished REY design
              and edit the message only.
            </p>

          </div>

        </div>


        <button
          onClick={() =>
            saveMutation.mutate()
          }
          disabled={
            !companyId ||
            saveMutation.isPending
          }
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            bg-[#111111]
            px-6
            py-3
            text-sm
            font-medium
            text-white
            transition
            hover:bg-black
            disabled:opacity-50
          "
        >

          {saveMutation.isPending ? (
            <Loader2
              className="
                h-4
                w-4
                animate-spin
              "
            />
          ) : (
            <Save
              className="h-4 w-4"
            />
          )}

          Save Template

        </button>

      </div>


      <div
        className="
          grid
          grid-cols-1
          gap-6
          xl:grid-cols-[390px_1fr]
        "
      >


        {/* LEFT */}

        <div className="space-y-6">


          {/* TEMPLATE SELECTOR */}

          <section
            className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
            "
          >

            <div className="mb-5">

              <div
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.3em]
                  text-[#ad884b]
                "
              >
                DESIGN LIBRARY
              </div>

              <h2
                className="
                  mt-1
                  font-serif
                  text-xl
                  text-slate-900
                "
              >
                Choose a template
              </h2>

            </div>


            <div className="space-y-2">

              {EMAIL_TEMPLATE_PRESETS.map(
                (template) => {

                  const active =
                    template.type ===
                    type;

                  return (
                    <button
                      key={template.type}
                      type="button"
                      onClick={() =>
                        changeTemplate(
                          template.type
                        )
                      }
                      className={`
                        w-full
                        rounded-2xl
                        border
                        p-4
                        text-left
                        transition
                        ${
                          active
                            ? "border-[#b99a61] bg-[#faf8f3]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }
                      `}
                    >

                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-3
                        "
                      >

                        <div>

                          <div
                            className="
                              text-sm
                              font-semibold
                              text-slate-900
                            "
                          >
                            {template.name}
                          </div>

                          <div
                            className="
                              mt-1
                              text-[10px]
                              font-semibold
                              uppercase
                              tracking-[0.15em]
                              text-[#ad884b]
                            "
                          >
                            {template.category}
                          </div>

                        </div>


                        {active && (
                          <div
                            className="
                              rounded-full
                              bg-[#111111]
                              px-2.5
                              py-1
                              text-[9px]
                              font-semibold
                              uppercase
                              tracking-wider
                              text-white
                            "
                          >
                            Selected
                          </div>
                        )}

                      </div>


                      <p
                        className="
                          mt-2
                          text-xs
                          leading-relaxed
                          text-slate-500
                        "
                      >
                        {template.description}
                      </p>

                    </button>
                  );
                }
              )}

            </div>

          </section>


          {/* CONTENT */}

          <section
            className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-sm
            "
          >

            <div className="mb-6">

              <div
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.3em]
                  text-[#ad884b]
                "
              >
                CONTENT ONLY
              </div>

              <h2
                className="
                  mt-1
                  font-serif
                  text-xl
                  text-slate-900
                "
              >
                Edit your message
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  leading-relaxed
                  text-slate-400
                "
              >
                Customise logos, colours and copy.
                Header & footer logos upload from your computer.
              </p>

            </div>


            {/* COMPANY */}

            <div className="mb-5">

              <label
                className="
                  text-xs
                  font-semibold
                  text-slate-600
                "
              >
                Company
              </label>

              <select
                value={companyId}
                onChange={(event) =>
                  setCompanyId(
                    event.target.value
                  )
                }
                disabled={
                  companiesLoading
                }
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-[#b99a61]
                "
              >

                {(
                  companies || []
                ).map(
                  (company: any) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  )
                )}

              </select>

            </div>



            {/* LOGOS — header & footer from local media */}
            <div className="mb-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Logos & colours
              </div>
              <p className="text-xs text-slate-400">
                Upload images from your computer. They are stored in media and used in the email header and footer.
                {templateId ? "" : " Save the template once first to enable server upload, or logos apply to live preview now."}
              </p>

              <LogoUpload
                label="Header logo"
                hint="Shown on the dark header bar"
                valueUrl={headerLogoUrl}
                onUpload={async (file) => {
                  // Local preview immediately
                  const local = URL.createObjectURL(file);
                  setHeaderLogoUrl(local);
                  if (templateId) {
                    const res = await templatesApi.uploadHeaderLogo(templateId, file);
                    const url = (res.data as any).header_logo_url;
                    if (url) setHeaderLogoUrl(url);
                  }
                }}
                onClear={async () => {
                  setHeaderLogoUrl("");
                  if (templateId) await templatesApi.clearHeaderLogo(templateId);
                }}
              />

              <LogoUpload
                label="Footer logo"
                hint="Shown in the light footer section"
                valueUrl={footerLogoUrl}
                onUpload={async (file) => {
                  const local = URL.createObjectURL(file);
                  setFooterLogoUrl(local);
                  if (templateId) {
                    const res = await templatesApi.uploadFooterLogo(templateId, file);
                    const url = (res.data as any).footer_logo_url;
                    if (url) setFooterLogoUrl(url);
                  }
                }}
                onClear={async () => {
                  setFooterLogoUrl("");
                  if (templateId) await templatesApi.clearFooterLogo(templateId);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Header width (px)</label>
                  <input type="number" min={60} max={280} value={headerLogoWidth}
                    onChange={(e) => setHeaderLogoWidth(Number(e.target.value) || 140)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Footer width (px)</label>
                  <input type="number" min={40} max={200} value={footerLogoWidth}
                    onChange={(e) => setFooterLogoWidth(Number(e.target.value) || 100)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Header background</label>
                  <input type="color" value={headerBg}
                    onChange={(e) => setHeaderBg(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Footer background</label>
                  <input type="color" value={footerBg}
                    onChange={(e) => setFooterBg(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Brand footer line</label>
                <input
                  value={companyFooter}
                  onChange={(e) => setCompanyFooter(e.target.value)}
                  placeholder="Sandstone Constructions — A Part of the REY Corporate Group."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>


            {/* TEMPLATE COLOURS */}
            <div className="mb-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Template colours
              </div>
              <p className="text-[11px] text-slate-400">
                These colours apply to the whole email design (preview updates live).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Accent (gold lines / labels)</label>
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Heading text</label>
                  <input type="color" value={headingColor} onChange={(e) => setHeadingColor(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Body text (default)</label>
                  <input type="color" value={bodyColor} onChange={(e) => setBodyColor(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Button background</label>
                  <input type="color" value={buttonBg} onChange={(e) => setButtonBg(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Button text</label>
                  <input type="color" value={buttonTextColor} onChange={(e) => setButtonTextColor(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Header background</label>
                  <input type="color" value={headerBg} onChange={(e) => setHeaderBg(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Footer background</label>
                  <input type="color" value={footerBg} onChange={(e) => setFooterBg(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* NAME */}

            <div className="mb-5">

              <label
                className="
                  text-xs
                  font-semibold
                  text-slate-600
                "
              >
                Template Name
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-[#b99a61]
                "
              />

            </div>


            {/* SUBJECT */}

            <div className="mb-5">

              <label
                className="
                  text-xs
                  font-semibold
                  text-slate-600
                "
              >
                Subject Line
              </label>

              <input
                value={subject}
                onChange={(event) =>
                  setSubject(
                    event.target.value
                  )
                }
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-[#b99a61]
                "
              />

            </div>


            {/* EYEBROW */}

            <div className="mb-5">

              <label
                className="
                  text-xs
                  font-semibold
                  text-slate-600
                "
              >
                Small Heading
              </label>

              <input
                value={eyebrow}
                onChange={(event) =>
                  setEyebrow(
                    event.target.value
                  )
                }
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-[#b99a61]
                "
              />

            </div>


            {/* HEADING */}

            <div className="mb-5">

              <label
                className="
                  text-xs
                  font-semibold
                  text-slate-600
                "
              >
                Main Heading
              </label>

              <input
                value={heading}
                onChange={(event) =>
                  setHeading(
                    event.target.value
                  )
                }
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-[#b99a61]
                "
              />

            </div>


            {/* BODY — rich text */}

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-600">
                Message
              </label>
              <p className="mt-1 mb-2 text-[11px] text-slate-400">
                Select text, then use Bold · Italic · Normal · Colour on the toolbar.
              </p>
              <div className="mt-2">
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Write your message… Select words to bold, italic, or recolour."
                  minHeight={200}
                />
              </div>
            </div>


            {/* BUTTON */}

            {preset.showButton && (
              <>
                <div className="mb-5">

                  <label
                    className="
                      text-xs
                      font-semibold
                      text-slate-600
                    "
                  >
                    Button Text
                  </label>

                  <input
                    value={buttonText}
                    onChange={(event) =>
                      setButtonText(
                        event.target.value
                      )
                    }
                    className="
                      mt-2
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-[#b99a61]
                    "
                  />

                </div>


                <div className="mb-5">

                  <label
                    className="
                      text-xs
                      font-semibold
                      text-slate-600
                    "
                  >
                    Button Destination
                  </label>

                  <input
                    value={buttonUrl}
                    onChange={(event) =>
                      setButtonUrl(
                        event.target.value
                      )
                    }
                    className="
                      mt-2
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-[#b99a61]
                    "
                  />

                </div>
              </>
            )}


            {/* EVENT */}

            {preset.showEventDetails && (
              <div
                className="
                  rounded-2xl
                  bg-[#faf9f6]
                  p-5
                "
              >

                <div
                  className="
                    mb-5
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.3em]
                    text-[#ad884b]
                  "
                >
                  EVENT DETAILS
                </div>


                <div className="space-y-4">

                  <input
                    value={eventName}
                    onChange={(event) =>
                      setEventName(
                        event.target.value
                      )
                    }
                    placeholder="Event name"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-3
                      text-sm
                    "
                  />


                  <input
                    value={eventDate}
                    onChange={(event) =>
                      setEventDate(
                        event.target.value
                      )
                    }
                    placeholder="Date"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-3
                      text-sm
                    "
                  />


                  <input
                    value={eventTime}
                    onChange={(event) =>
                      setEventTime(
                        event.target.value
                      )
                    }
                    placeholder="Time"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-3
                      text-sm
                    "
                  />


                  <input
                    value={eventLocation}
                    onChange={(event) =>
                      setEventLocation(
                        event.target.value
                      )
                    }
                    placeholder="Location"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-3
                      text-sm
                    "
                  />

                </div>

              </div>
            )}


            {/* SUBSCRIBE / UNSUBSCRIBE */}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-[#faf8f3] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#ad884b]">
                    List management
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">
                    Subscribe / Unsubscribe in email
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    When recipients click these links: Subscribe registers a new contact
                    (or re-activates them). Unsubscribe removes them from the list automatically.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
                  <input
                    type="checkbox"
                    checked={showSubscribeBlock}
                    onChange={(e) => setShowSubscribeBlock(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  Show in email
                </label>
              </div>

              {showSubscribeBlock && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Subscribe URL
                    </label>
                    <input
                      value={subscribeUrl}
                      onChange={(e) => setSubscribeUrl(e.target.value)}
                      placeholder="{{ subscribe_url }}"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#b99a61]"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Use <code className="bg-white px-1 rounded">{'{{ subscribe_url }}'}</code> — filled at send time
                      with <code className="bg-white px-1 rounded">/subscribe/?company=…</code> (registers the user).
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Unsubscribe URL
                    </label>
                    <input
                      value={unsubscribeUrl}
                      onChange={(e) => setUnsubscribeUrl(e.target.value)}
                      placeholder="{{ unsubscribe_url }}"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#b99a61]"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Use <code className="bg-white px-1 rounded">{'{{ unsubscribe_url }}'}</code> — unique per recipient
                      so one-click unsubscribe works and updates the list.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* DEFAULT */}

            <label
              className="
                mt-5
                flex
                cursor-pointer
                items-center
                gap-3
                text-sm
                text-slate-600
              "
            >

              <input
                type="checkbox"
                checked={isDefault}
                onChange={(event) =>
                  setIsDefault(
                    event.target.checked
                  )
                }
                className="
                  h-4
                  w-4
                  rounded
                "
              />

              Make this the default
              template for this type.

            </label>

          </section>

        </div>


        {/* RIGHT PREVIEW */}

        <section
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-[#e9e8e4]
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-200
              bg-white
              px-5
              py-4
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-slate-700
              "
            >

              <Eye
                className="h-4 w-4"
              />

              Live Preview

            </div>


            <div
              className="
                rounded-full
                bg-[#faf8f3]
                px-3
                py-1
                text-[9px]
                font-semibold
                uppercase
                tracking-wider
                text-[#ad884b]
              "
            >
              REY LUXURY
            </div>

          </div>


          <div
            className="
              border-b
              border-slate-200
              bg-white
              px-5
              py-3
            "
          >

            <div
              className="
                text-[10px]
                uppercase
                tracking-wider
                text-slate-400
              "
            >
              Subject
            </div>

            <div
              className="
                mt-1
                truncate
                text-sm
                text-slate-700
              "
            >
              {subject
                .replace(
                  /\{\{\s*company\.name\s*\}\}/g,
                  selectedCompany?.name ||
                    "REY Corporate Group"
                )
                .replace(
                  /\{\{\s*full_name\s*\}\}/g,
                  recipientName
                )
                .replace(
                  /\{\{\s*event\.name\s*\}\}/g,
                  eventName
                )}
            </div>

          </div>


          <div
            className="
              min-h-[900px]
              p-4
              md:p-8
            "
          >

            <iframe
              title="REY luxury email preview"
              srcDoc={previewHtml}
              className="
                h-[900px]
                w-full
                border-0
                bg-[#e9e8e4]
              "
              sandbox=""
            />

          </div>

        </section>

      </div>

    </div>
  );
}