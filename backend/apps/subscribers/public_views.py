"""
Public HTML pages for Subscribe / Unsubscribe from email links.
Works without the Next.js frontend so email clicks always succeed.
"""
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from apps.companies.models import Company
from .models import Subscriber


def _page(title: str, body: str, company_name: str = "REY") -> HttpResponse:
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} · {company_name}</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: #f4f2ee; color: #1a1a1a; min-height: 100vh;
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }}
    .card {{
      background: #fff; max-width: 440px; width: 100%; border-radius: 16px;
      padding: 36px 32px; box-shadow: 0 8px 32px rgba(10,37,64,.08);
      border: 1px solid #e8e4dc;
    }}
    h1 {{ font-size: 22px; margin: 0 0 8px; letter-spacing: -0.02em; }}
    p {{ color: #555; font-size: 14px; line-height: 1.55; margin: 0 0 20px; }}
    label {{ display: block; font-size: 12px; font-weight: 600; color: #333; margin-bottom: 6px; }}
    input, textarea {{
      width: 100%; padding: 11px 14px; border: 1px solid #d8d4cc; border-radius: 10px;
      font-size: 14px; margin-bottom: 14px; background: #fafaf8;
    }}
    input:focus, textarea:focus {{ outline: none; border-color: #0A2540; background: #fff; }}
    button {{
      width: 100%; padding: 13px; border: none; border-radius: 10px;
      background: #0A2540; color: #fff; font-size: 14px; font-weight: 600;
      cursor: pointer; margin-top: 6px;
    }}
    button:hover {{ background: #0d3358; }}
    .muted {{ font-size: 12px; color: #888; margin-top: 16px; text-align: center; }}
    .ok {{ color: #276749; }}
    .err {{ color: #c53030; }}
    .brand {{ font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
              color: #B99A61; font-weight: 700; margin-bottom: 12px; }}
  </style>
</head>
<body>
  <div class="card">
    {body}
  </div>
</body>
</html>"""
    return HttpResponse(html, content_type="text/html; charset=utf-8")


@csrf_exempt
@require_http_methods(["GET", "POST"])
def public_subscribe_page(request):
    """
    GET  /subscribe/?company=<slug>  → form
    POST /subscribe/                 → register / re-subscribe user
    """
    slug = (
        request.GET.get("company")
        or request.POST.get("company")
        or request.GET.get("c")
        or ""
    ).strip().lower()

    company = None
    if slug:
        company = Company.objects.filter(slug=slug, is_active=True).first()
    if not company:
        # fall back to parent
        company = Company.objects.filter(is_parent=True, is_active=True).first()
    if not company:
        return _page(
            "Subscribe",
            '<p class="err">Company not found. Please use a valid subscribe link.</p>',
        )

    company_name = company.name

    if request.method == "POST":
        full_name = (request.POST.get("full_name") or "").strip()
        email = (request.POST.get("email") or "").strip().lower()
        phone = (request.POST.get("phone") or "").strip()
        consent = request.POST.get("consent") in ("on", "true", "1", "yes")

        if not full_name or not email or "@" not in email:
            body = f"""
            <div class="brand">{company_name}</div>
            <h1>Subscribe</h1>
            <p class="err">Please enter a valid name and email address.</p>
            <p><a href="?company={company.slug}">Try again</a></p>
            """
            return _page("Subscribe", body, company_name)

        if not consent:
            body = f"""
            <div class="brand">{company_name}</div>
            <h1>Subscribe</h1>
            <p class="err">Marketing consent is required to subscribe.</p>
            <p><a href="?company={company.slug}">Try again</a></p>
            """
            return _page("Subscribe", body, company_name)

        sub, created = Subscriber.objects.get_or_create(
            company=company,
            email=email,
            defaults={
                "full_name": full_name,
                "phone": phone,
                "is_subscribed": True,
                "subscribed_at": timezone.now(),
                "source": "website",
                "source_detail": "email_subscribe_link",
                "marketing_consent": True,
            },
        )
        if not created:
            sub.full_name = full_name or sub.full_name
            if phone:
                sub.phone = phone
            if not sub.is_subscribed:
                sub.subscribe()
            else:
                sub.marketing_consent = True
                sub.save(update_fields=["full_name", "phone", "marketing_consent", "updated_at"])

        # Optional welcome email
        try:
            from apps.core.email_service import send_smart_email
            send_smart_email(
                company=company,
                to_email=sub.email,
                full_name=sub.full_name,
                body_content=(
                    f"Thank you for subscribing to <strong>{company.name}</strong>. "
                    "You will receive updates, invitations and news from our team."
                ),
                subject=f"Welcome to {company.name}",
                template_type="thank_you_registration",
                cta_text="Visit our website",
                cta_url=company.website or "",
            )
        except Exception:
            pass

        msg = "You're subscribed!" if created else "Your subscription is active again."
        body = f"""
        <div class="brand">{company_name}</div>
        <h1 class="ok">{msg}</h1>
        <p>Thank you, <strong>{sub.full_name}</strong>. You will receive emails from {company_name}.</p>
        <p class="muted">You can unsubscribe at any time using the link in our emails.</p>
        """
        return _page("Subscribed", body, company_name)

    # GET — show form
    website = company.website or "#"
    body = f"""
    <div class="brand">{company_name}</div>
    <h1>Subscribe to updates</h1>
    <p>Join the {company_name} list for invitations, news and exclusive updates.</p>
    <form method="post" action="">
      <input type="hidden" name="company" value="{company.slug}" />
      <label for="full_name">Full name</label>
      <input id="full_name" name="full_name" required placeholder="Alex Thompson" />
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required placeholder="alex@example.com" />
      <label for="phone">Phone <span style="font-weight:400;color:#999">(optional)</span></label>
      <input id="phone" name="phone" type="tel" placeholder="+61 …" />
      <label style="display:flex;align-items:flex-start;gap:8px;font-weight:400;margin:8px 0 16px;">
        <input type="checkbox" name="consent" checked required style="width:auto;margin:3px 0 0;" />
        <span>I agree to receive marketing emails from {company_name} and understand I can unsubscribe at any time.</span>
      </label>
      <button type="submit">Subscribe</button>
    </form>
    <p class="muted"><a href="{website}" style="color:#0A2540;">Visit website</a></p>
    """
    return _page("Subscribe", body, company_name)
