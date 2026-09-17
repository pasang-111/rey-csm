import {
  REY_CORPORATE_LOGO,
  REY_CORPORATE_WEBSITE,
} from "./emailTemplates";

type LuxuryEmailOptions = {
  companyName: string;

  eyebrow: string;
  heading: string;
  body: string;
  /** If true, body is treated as HTML (bold/italic/colour from editor) */
  bodyIsHtml?: boolean;

  recipientName?: string;
  recipientEmail?: string;

  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;

  primaryButtonText?: string;
  primaryButtonUrl?: string;

  secondaryText?: string;

  /** Footer + body subscribe link (defaults to website) */
  subscribeUrl?: string;
  /** Footer + body unsubscribe link */
  unsubscribeUrl?: string;

  /** Absolute URL of header logo (uploaded media) */
  headerLogoUrl?: string;
  /** Absolute URL of footer logo (uploaded media) */
  footerLogoUrl?: string;
  /** Header background colour */
  headerBg?: string;
  /** Footer background colour */
  footerBg?: string;
  /** Brand footer line e.g. "Sandstone — A Part of the REY Corporate Group." */
  companyFooter?: string;
  /** Header logo width in px */
  headerLogoWidth?: number;
  /** Footer logo width in px */
  footerLogoWidth?: number;
  /** Link when clicking logos */
  logoLink?: string;
  /** Accent / gold line colour */
  accentColor?: string;
  /** Main heading text colour */
  headingColor?: string;
  /** Body text colour (default for non-HTML) */
  bodyColor?: string;
  /** Button background */
  buttonBg?: string;
  /** Button text colour */
  buttonTextColor?: string;

  /** Optional full-width hero image below header */
  heroImageUrl?: string;
  heroImageAlt?: string;
  heroImageLink?: string;

  /** Article cards in a 2-column grid (newsletter / campaign) */
  articles?: Array<{
    title: string;
    excerpt?: string;
    imageUrl?: string;
    imageAlt?: string;
    url?: string;
  }>;
};

function escapeHtml(value: string = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderBody(value: string = "", asHtml = false) {
  if (asHtml) {
    // Allow a safe subset of formatting tags from the rich editor
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "");
  }
  return escapeHtml(value)
    .replace(/\n\n/g, "<br /><br />")
    .replace(/\n/g, "<br />");
}

export function buildLuxuryEmail({
  companyName,
  eyebrow,
  heading,
  body,
  bodyIsHtml = false,

  recipientName,
  recipientEmail,

  eventName,
  eventDate,
  eventTime,
  eventLocation,

  primaryButtonText,
  primaryButtonUrl,

  secondaryText,

  subscribeUrl = REY_CORPORATE_WEBSITE,
  unsubscribeUrl = "#",

  headerLogoUrl,
  footerLogoUrl,
  headerBg = "#0A2540",
  footerBg = "#f7f5f1",
  companyFooter,
  headerLogoWidth = 140,
  footerLogoWidth = 100,
  logoLink = REY_CORPORATE_WEBSITE,
  accentColor = "#b99a61",
  headingColor = "#171717",
  bodyColor = "#444444",
  buttonBg = "#111111",
  buttonTextColor = "#ffffff",
  heroImageUrl,
  heroImageAlt = "",
  heroImageLink,
  articles = [],
}: LuxuryEmailOptions) {
  const year = new Date().getFullYear();
  const headerLogoSrc = headerLogoUrl || REY_CORPORATE_LOGO;
  const footerLogoSrc = footerLogoUrl || headerLogoUrl || REY_CORPORATE_LOGO;
  const safeFooter = escapeHtml(companyFooter || companyName);
  const hw = headerLogoWidth || 140;
  const fw = footerLogoWidth || 100;
  const safeLogoLink = logoLink || REY_CORPORATE_WEBSITE;

  const safeCompanyName = escapeHtml(companyName);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeHeading = escapeHtml(heading);
  const safeBody = renderBody(body, bodyIsHtml);
  const safeRecipient = escapeHtml(recipientName);
  const safeRecipientEmail = escapeHtml(recipientEmail);
  const safeEventName = escapeHtml(eventName);
  const safeEventDate = escapeHtml(eventDate);
  const safeEventTime = escapeHtml(eventTime);
  const safeEventLocation = escapeHtml(eventLocation);
  const safeSecondary = escapeHtml(secondaryText);
  const safeButton = escapeHtml(primaryButtonText);

  const eventDetails =
    eventName || eventDate || eventTime || eventLocation
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="margin:34px 0;background:#faf9f6;border:1px solid #ded8cd;">
          <tr>
            <td style="padding:30px;">
              ${
                eventName
                  ? `<div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:#171717;margin-bottom:24px;">${safeEventName}</div>`
                  : ""
              }
              ${
                eventDate
                  ? `<div style="margin-bottom:18px;">
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:2px;color:#aa8750;text-transform:uppercase;margin-bottom:6px;">DATE</div>
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#292929;">${safeEventDate}</div>
                    </div>`
                  : ""
              }
              ${
                eventTime
                  ? `<div style="margin-bottom:18px;">
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:2px;color:#aa8750;text-transform:uppercase;margin-bottom:6px;">TIME</div>
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#292929;">${safeEventTime}</div>
                    </div>`
                  : ""
              }
              ${
                eventLocation
                  ? `<div>
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:2px;color:#aa8750;text-transform:uppercase;margin-bottom:6px;">LOCATION</div>
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#292929;">${safeEventLocation}</div>
                    </div>`
                  : ""
              }
            </td>
          </tr>
        </table>
      `
      : "";

  /* ── Prominent primary CTA ── */
  const button =
    primaryButtonText && primaryButtonUrl
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:36px auto 8px;">
          <tr>
            <td align="center" style="background:${buttonBg};border-radius:4px;">
              <a href="${primaryButtonUrl}" target="_blank"
                style="display:inline-block;padding:18px 42px;color:#ffffff;text-decoration:none;
                       font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;
                       letter-spacing:2.5px;text-transform:uppercase;border-radius:4px;">
                ${safeButton}
              </a>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
          <tr>
            <td style="width:48px;height:3px;background:${accentColor};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
      `
      : "";


  /* ── Hero image ── */
  const heroBlock = heroImageUrl
    ? `
      <tr>
        <td style="padding:0;line-height:0;font-size:0;">
          ${heroImageLink
            ? `<a href="${escapeHtml(heroImageLink)}" target="_blank" style="text-decoration:none;">`
            : ""}
          <img src="${escapeHtml(heroImageUrl)}" alt="${escapeHtml(heroImageAlt || heading || companyName)}"
            width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
          ${heroImageLink ? "</a>" : ""}
        </td>
      </tr>
    `
    : "";

  /* ── Article grid (2-column cards) ── */
  const articleCards = (articles || []).filter((a) => a && a.title);
  let articlesBlock = "";
  if (articleCards.length > 0) {
    const rows: string[] = [];
    for (let i = 0; i < articleCards.length; i += 2) {
      const left = articleCards[i];
      const right = articleCards[i + 1];
      const card = (a: typeof left | undefined) => {
        if (!a) {
          return `<td width="50%" style="padding:8px;vertical-align:top;"></td>`;
        }
        const img = a.imageUrl
          ? `<img src="${escapeHtml(a.imageUrl)}" alt="${escapeHtml(a.imageAlt || a.title)}" width="260"
               style="display:block;width:100%;max-width:260px;height:auto;border:0;border-radius:4px;" />`
          : `<div style="width:100%;height:140px;background:#f0ece4;border-radius:4px;"></div>`;
        const titleHtml = a.url
          ? `<a href="${escapeHtml(a.url)}" target="_blank" style="color:${headingColor};text-decoration:none;">${escapeHtml(a.title)}</a>`
          : escapeHtml(a.title);
        const excerpt = a.excerpt
          ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${bodyColor};margin-top:8px;">${escapeHtml(a.excerpt)}</div>`
          : "";
        const link = a.url
          ? `<div style="margin-top:12px;"><a href="${escapeHtml(a.url)}" target="_blank"
               style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1px;
                      text-transform:uppercase;color:${accentColor};text-decoration:none;">Read more →</a></div>`
          : "";
        return `
          <td width="50%" style="padding:8px;vertical-align:top;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
              style="background:#faf9f6;border:1px solid #e8e4dc;border-radius:6px;overflow:hidden;">
              <tr><td style="padding:0;line-height:0;">${img}</td></tr>
              <tr>
                <td style="padding:16px;">
                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.35;color:${headingColor};">
                    ${titleHtml}
                  </div>
                  ${excerpt}
                  ${link}
                </td>
              </tr>
            </table>
          </td>`;
      };
      rows.push(`
        <tr>
          ${card(left)}
          ${card(right)}
        </tr>`);
    }
    articlesBlock = `
      <div style="margin:28px 0 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${rows.join("")}
        </table>
      </div>`;
  }

  /* ── Subscribe / Unsubscribe block in BODY after CTA ── */
  const bodySubscribeBlock = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
      <tr>
        <td align="center" style="padding:20px 16px;background:#faf9f6;border:1px solid #e8e4dc;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.5px;
                      text-transform:uppercase;color:#aa8750;font-weight:bold;margin-bottom:10px;">
            Stay connected
          </div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#555555;margin-bottom:14px;">
            Prefer fewer emails? Update your preferences anytime.
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td style="padding:0 6px;">
                <a href="${subscribeUrl}" target="_blank"
                  style="display:inline-block;padding:10px 20px;background:${buttonBg};color:${buttonTextColor};
                         text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:11px;
                         font-weight:bold;letter-spacing:1px;text-transform:uppercase;border-radius:3px;">
                  Subscribe
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="${unsubscribeUrl}" target="_blank"
                  style="display:inline-block;padding:10px 20px;background:#ffffff;color:#0A2540;
                         text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:11px;
                         font-weight:bold;letter-spacing:1px;text-transform:uppercase;
                         border:1px solid #0A2540;border-radius:3px;">
                  Unsubscribe
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  /* ── Footer subscribe / unsubscribe line ── */
  const footerSubscribeLine = `
    <div style="margin-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#888888;">
      <a href="${subscribeUrl}" target="_blank" style="color:#0A2540;text-decoration:underline;font-weight:600;">Subscribe</a>
      &nbsp;&nbsp;·&nbsp;&nbsp;
      <a href="${unsubscribeUrl}" style="color:#888888;text-decoration:underline;">Unsubscribe</a>
      &nbsp;&nbsp;·&nbsp;&nbsp;
      <a href="${REY_CORPORATE_WEBSITE}" target="_blank" style="color:#888888;text-decoration:none;">reycorp.com.au</a>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeHeading || safeCompanyName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;">

          <!-- GOLD TOP BAR -->
          <tr>
            <td style="height:5px;background:${accentColor};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- HEADER / LOGO -->
          <tr>
            <td align="center" style="padding:36px 30px 28px;background:${headerBg};">
              <a href="${safeLogoLink}" target="_blank" style="text-decoration:none;">
                <img src="${headerLogoSrc}" alt="${safeCompanyName}" width="${hw}"
                  style="display:block;width:${hw}px;max-width:55%;height:auto;margin:0 auto;border:0;" />
              </a>
              <div style="margin-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:9px;
                          letter-spacing:3px;text-transform:uppercase;color:${accentColor};">
                ${safeCompanyName}
              </div>
            </td>
          </tr>

          ${heroBlock}

          <!-- BODY -->
          <tr>
            <td style="padding:40px 36px 32px;">

              ${
                safeEyebrow
                  ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;
                                letter-spacing:3px;text-transform:uppercase;color:${accentColor};margin-bottom:14px;text-align:center;">
                       ${safeEyebrow}
                     </div>`
                  : ""
              }

              ${
                safeHeading
                  ? `<div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.3;
                                color:${headingColor};margin-bottom:22px;text-align:center;">
                       ${safeHeading}
                     </div>`
                  : ""
              }

              ${
                safeRecipient
                  ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#171717;margin-bottom:6px;font-weight:600;">
                       Dear ${safeRecipient},
                     </div>`
                  : `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#171717;margin-bottom:6px;font-weight:600;">
                       Dear Valued Client,
                     </div>`
              }
              ${
                safeRecipientEmail
                  ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#888888;margin-bottom:18px;">
                       To: ${safeRecipientEmail}
                     </div>`
                  : ""
              }

              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:${bodyColor};">
                ${safeBody}
              </div>

              ${eventDetails}

              ${
                secondaryText
                  ? `<div style="margin-top:22px;font-family:Arial,Helvetica,sans-serif;font-size:13px;
                                 line-height:1.7;color:#858585;text-align:center;">
                       ${safeSecondary}
                     </div>`
                  : ""
              }

              ${articlesBlock}

              <!-- PRIMARY CTA (promoted) -->
              ${button}

              <!-- BODY: Subscribe / Unsubscribe -->
              ${bodySubscribeBlock}

              <!-- SIGNATURE (sender section) -->
              <div style="margin-top:36px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.8;color:#777777;">
                Kind regards,<br />
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#1b1b1b;">
                  The ${safeCompanyName} Team
                </span>
              </div>

            </td>
          </tr>

          <!-- FOOTER / SENDER SECTION -->
          <tr>
            <td align="center" style="background:${footerBg};padding:32px 30px;border-top:1px solid #e4dfd6;">

              <a href="${safeLogoLink}" target="_blank" style="text-decoration:none;">
                <img src="${footerLogoSrc}" alt="${safeCompanyName}" width="${fw}"
                  style="display:block;width:${fw}px;max-width:45%;height:auto;margin:0 auto 16px;border:0;" />
              </a>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#333333;font-weight:600;margin-bottom:4px;">
                ${safeCompanyName}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#888888;margin-bottom:10px;">
                ${safeFooter}
              </div>

              ${
                safeRecipient || safeRecipientEmail
                  ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#666666;margin-bottom:10px;">
                       This email was sent to
                       <strong style="color:#333333;">${safeRecipient || "you"}</strong>
                       ${safeRecipientEmail ? `(${safeRecipientEmail})` : ""}.
                     </div>`
                  : ""
              }

              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#999999;">
                © ${year} ${safeCompanyName}. All rights reserved.
              </div>

              <!-- FOOTER: Subscribe / Unsubscribe (always present) -->
              ${footerSubscribeLine}

            </td>
          </tr>

          <!-- GOLD BOTTOM BAR -->
          <tr>
            <td style="height:5px;background:${accentColor};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
