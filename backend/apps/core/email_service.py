"""
Smart email service for REY CMS.

Every outbound email uses the same structure:
  HEADER  → company logo (or name) + brand colours
  BODY    → personalised message (Dear {{ full_name }})
  FOOTER  → address, contact, © year company. All rights reserved.

The system picks the right company, template type, and colours automatically.
"""
from django.template.loader import render_to_string
from django.template import Template, Context
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from pathlib import Path


def format_from_email(company, fallback_email: str = "noreply@reycorp.com.au") -> str:
    """
    RFC-style From header so inboxes show a clear display name:
      "Rey Corporate Group <noreply@reycorp.com.au>"
    Not just the raw address.
    """
    email = (getattr(company, "from_email", None) or "").strip() or fallback_email
    name = (getattr(company, "name", None) or "").strip() or "Rey Corporate Group"
    # Avoid nested quotes breaking the header
    name = name.replace('"', "").replace("<", "").replace(">", "")
    return f'"{name}" <{email}>'


def format_reply_to(company, fallback_email: str = "noreply@reycorp.com.au") -> list:
    """Prefer reply_to / support, always with a real address."""
    addr = (
        (getattr(company, "reply_to_email", None) or "").strip()
        or (getattr(company, "support_email", None) or "").strip()
        or (getattr(company, "from_email", None) or "").strip()
        or fallback_email
    )
    return [addr]


def _year():
    return timezone.now().year


def build_context(company, full_name, body_content, **extra):
    """Standard context for every email."""
    primary = extra.pop('primary_color', None) or company.primary_color or '#0A2540'
    secondary = extra.pop('secondary_color', None) or company.secondary_color or '#1E3A5F'
    return {
        'company': company,
        'full_name': full_name or 'Valued Customer',
        'body_content': body_content,
        'logo_url': company.logo_url if hasattr(company, 'logo_url') else (company.logo.url if company.logo else None),
        'primary_color': primary,
        'secondary_color': secondary,
        'year': _year(),
        'unsubscribe_url': extra.get('unsubscribe_url') or f"{getattr(__import__('django.conf', fromlist=['settings']).settings, 'PUBLIC_BASE_URL', 'http://127.0.0.1:8000').rstrip('/')}/unsubscribe/",
        'subscribe_url': extra.get('subscribe_url') or f"{getattr(__import__('django.conf', fromlist=['settings']).settings, 'PUBLIC_BASE_URL', 'http://127.0.0.1:8000').rstrip('/')}/subscribe/?company={getattr(company, 'slug', '')}",
        'cta_text': extra.get('cta_text', ''),
        'cta_url': extra.get('cta_url', ''),
        'subject': extra.get('subject', ''),
        **{k: v for k, v in extra.items() if k not in ('unsubscribe_url', 'cta_text', 'cta_url', 'subject')},
    }


def render_system_email(company, full_name, body_content, **extra):
    """
    Render the standard shell: logo header + body + copyright footer.
    Prefer DB EmailTemplate if type is given; else system_shell.html.
    """
    from apps.templates_app.models import EmailTemplate

    template_type = extra.get('template_type')
    html = None

    if template_type:
        tpl = (
            EmailTemplate.objects.filter(
                company=company, type=template_type, is_default=True, is_active=True
            ).first()
            or EmailTemplate.objects.filter(
                company=company, type=template_type, is_active=True
            ).first()
        )
        if tpl:
            ctx = build_context(
                company, full_name, body_content,
                primary_color=tpl.primary_color or company.primary_color,
                secondary_color=tpl.secondary_color or company.secondary_color,
                subject=tpl.subject,
                **extra,
            )
            # If template HTML already has structure, render it; inject body if needed
            html = Template(tpl.html_body).render(Context(ctx))
            subject = Template(tpl.subject).render(Context(ctx))
            return subject, html

    ctx = build_context(company, full_name, body_content, **extra)
    try:
        html = render_to_string('emails/system_shell.html', ctx)
    except Exception:
        # Fallback minimal if template file missing
        html = f"""
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:{ctx['primary_color']};padding:24px;text-align:center;color:#fff;">
            <strong>{company.name}</strong>
          </div>
          <div style="padding:24px;">
            <p>Dear {full_name},</p>
            <div>{body_content}</div>
            <p>Kind regards,<br/>The {company.name} Team</p>
          </div>
          <div style="padding:16px;text-align:center;font-size:12px;color:#888;background:#fafafa;">
            © {ctx['year']} {company.name}. All rights reserved.
          </div>
        </div>
        """
    subject = extra.get('subject') or f"Message from {company.name}"
    subject = Template(subject).render(Context(ctx))
    return subject, html


def send_smart_email(
    *,
    company,
    to_email,
    full_name,
    body_content,
    subject=None,
    template_type=None,
    cta_text='',
    cta_url='',
    reply_to=None,
):
    """
    One smart send for the whole system:
    subscribe welcome, enquiry thank-you, invitation, custom, etc.
    """
    subj, html = render_system_email(
        company,
        full_name,
        body_content,
        subject=subject or f"Message from {company.name}",
        template_type=template_type,
        cta_text=cta_text,
        cta_url=cta_url or (company.website or ''),
    )
    from_header = format_from_email(company)
    reply = reply_to or (format_reply_to(company)[0] if company else 'noreply@reycorp.com.au')

    # Prefer "Name <email>" when full_name is available
    display_to = to_email
    if full_name and full_name.strip():
        clean = full_name.replace('"', '').strip()
        display_to = f'"{clean}" <{to_email}>'

    msg = EmailMultiAlternatives(
        subject=subj,
        body='Please view this email in an HTML-capable client.',
        from_email=from_header,  # e.g. "Rey Homes <hello@reyhomes.com.au>"
        to=[display_to],         # e.g. "Alex Thompson <alex@example.com>"
        reply_to=[reply] if reply else None,
    )
    # Extra headers some clients use for "display name"
    msg.extra_headers = {
        **getattr(msg, 'extra_headers', {}),
        'X-Mailer': 'Rey CMS',
        'Sender': from_header,
    }
    msg.attach_alternative(html, 'text/html')
    msg.send(fail_silently=False)
    return {'subject': subj, 'to': to_email, 'from': from_header}
