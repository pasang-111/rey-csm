"""Public open/click/unsubscribe tracking endpoints."""
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import NewsletterRecipient, EmailEvent


# 1x1 transparent GIF
PIXEL = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00"
    b"\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
)


@api_view(["GET"])
@permission_classes([AllowAny])
def track_open(request, token):
    try:
        rec = NewsletterRecipient.objects.select_related("newsletter", "subscriber").get(
            tracking_token=token
        )
    except NewsletterRecipient.DoesNotExist:
        return HttpResponse(PIXEL, content_type="image/gif")

    fields = []
    if hasattr(rec, "opened_at") and not rec.opened_at:
        rec.opened_at = timezone.now()
        fields.append("opened_at")
        if rec.status == "sent":
            rec.status = "opened"
            fields.append("status")
        first_open = True
    else:
        first_open = False
    if hasattr(rec, "open_count"):
        rec.open_count = (rec.open_count or 0) + 1
        fields.append("open_count")
    if fields:
        rec.save(update_fields=fields)
    if first_open:
        n = rec.newsletter
        if hasattr(n, "total_opened"):
            n.total_opened = (n.total_opened or 0) + 1
            n.save(update_fields=["total_opened"])
        try:
            EmailEvent.objects.create(
                newsletter=n,
                recipient=rec,
                email=rec.email or "",
                event="opened",
            )
        except Exception:
            pass

    return HttpResponse(PIXEL, content_type="image/gif")


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def track_unsubscribe(request, token):
    """One-click unsubscribe from email link."""
    rec = get_object_or_404(
        NewsletterRecipient.objects.select_related("subscriber", "newsletter", "newsletter__company"),
        tracking_token=token,
    )
    reason = ""
    if request.method == "POST":
        reason = (request.data.get("reason") or "")[:255]

    sub = rec.subscriber
    if sub and sub.is_subscribed:
        sub.unsubscribe(reason=reason or "email_link")

    rec.status = "unsubscribed"
    rec.save(update_fields=["status"])

    n = rec.newsletter
    n.total_unsubscribed = (n.total_unsubscribed or 0) + 1
    n.save(update_fields=["total_unsubscribed"])

    EmailEvent.objects.create(
        newsletter=n,
        recipient=rec,
        email=rec.email,
        event="unsubscribed",
        detail=reason,
    )

    company_name = getattr(getattr(n, "company", None), "name", "REY")
    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:60px auto;padding:24px;text-align:center;">
  <h1 style="font-size:22px;">You're unsubscribed</h1>
  <p style="color:#555;">You will no longer receive marketing emails from <strong>{company_name}</strong>.</p>
  <p style="color:#888;font-size:13px;">If this was a mistake, contact the team to resubscribe.</p>
</body></html>"""
    return HttpResponse(html, content_type="text/html")


@api_view(["GET"])
@permission_classes([AllowAny])
def track_click(request, token):
    """Redirect through click tracker then to target URL."""
    from django.shortcuts import redirect
    from urllib.parse import unquote

    target = request.GET.get("u") or request.GET.get("url") or "/"
    try:
        target = unquote(target)
    except Exception:
        pass
    if not target.startswith("http"):
        target = "https://" + target.lstrip("/")

    try:
        rec = NewsletterRecipient.objects.select_related("newsletter").get(tracking_token=token)
    except NewsletterRecipient.DoesNotExist:
        return redirect(target)

    fields = []
    if hasattr(rec, "clicked_at") and not rec.clicked_at:
        from django.utils import timezone
        rec.clicked_at = timezone.now()
        fields.append("clicked_at")
        if rec.status in ("sent", "opened", "delivered"):
            rec.status = "clicked"
            fields.append("status")
        first = True
    else:
        first = False
    if hasattr(rec, "click_count"):
        rec.click_count = (rec.click_count or 0) + 1
        fields.append("click_count")
    if fields:
        rec.save(update_fields=fields)
    if first:
        n = rec.newsletter
        if hasattr(n, "total_clicked"):
            n.total_clicked = (n.total_clicked or 0) + 1
            n.save(update_fields=["total_clicked"])
        try:
            EmailEvent.objects.create(
                newsletter=n,
                recipient=rec,
                email=rec.email or "",
                event="clicked",
                detail=target[:500],
            )
        except Exception:
            pass
    return redirect(target)
