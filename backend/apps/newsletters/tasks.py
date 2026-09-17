try:
    from celery import shared_task
except ImportError:
    def shared_task(*args, **kwargs):
        def decorator(fn):
            fn.delay = lambda *a, **k: fn(*a, **k)
            fn.apply_async = lambda *a, **k: fn(*a, **k)
            return fn
        if args and callable(args[0]):
            return decorator(args[0])
        return decorator
from django.conf import settings
from django.core.mail import get_connection, EmailMultiAlternatives
from django.template import Template, Context
from django.utils import timezone
import logging
import time

from apps.core.email_service import format_from_email, format_reply_to

logger = logging.getLogger(__name__)

BATCH_SIZE = getattr(settings, "EMAIL_BATCH_SIZE", 40)
BATCH_PAUSE = getattr(settings, "EMAIL_BATCH_PAUSE_SECONDS", 1.5)

def _public_base():
    return getattr(settings, "PUBLIC_BASE_URL", None) or getattr(settings, "SITE_URL", None) or "http://127.0.0.1:8000"


def _inject_tracking(html: str, token, base: str) -> str:
    """Append open pixel and wrap http(s) links for click tracking."""
    import re
    from urllib.parse import quote

    if not html:
        return html
    pixel = f'<img src="{base}/api/track/open/{token}.gif" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />'
    if "api/track/open/" not in html:
        if "</body>" in html.lower():
            html = re.sub(r"(?i)</body>", pixel + "</body>", html, count=1)
        else:
            html = html + pixel

    def repl(m):
        url = m.group(1)
        if "api/track/" in url or "unsubscribe" in url:
            return m.group(0)
        tracked = f'{base}/api/track/click/{token}/?u={quote(url, safe="")}'
        return f'href="{tracked}"'

    html = re.sub(r'href="(https?://[^"]+)"', repl, html)
    return html



def _build_message(company, subscriber, subject_tpl, html_tpl, plain_tpl, unsubscribe_url, tracking_token=None):
    full_name = (subscriber.full_name or "").strip() or "Valued Client"
    base = _public_base().rstrip("/")
    slug = getattr(company, "slug", "") or ""
    ctx = {
        "full_name": full_name,
        "email": subscriber.email,
        "company": company,
        "logo_url": getattr(company, "logo_url", None),
        "primary_color": getattr(company, "primary_color", "#0A2540"),
        "secondary_color": getattr(company, "secondary_color", "#B99A61"),
        "unsubscribe_url": unsubscribe_url,
        "subscribe_url": f"{base}/subscribe/?company={slug}",
        "year": timezone.now().year,
    }
    subject = Template(subject_tpl).render(Context(ctx))
    html = Template(html_tpl).render(Context(ctx))
    plain = Template(plain_tpl or "Please view this email in HTML.").render(Context(ctx))

    from_header = format_from_email(company)
    reply_list = format_reply_to(company)
    clean_name = full_name.replace('"', "")
    to_header = f'"{clean_name}" <{subscriber.email}>'

    msg = EmailMultiAlternatives(
        subject=subject,
        body=plain,
        from_email=from_header,
        to=[to_header],
        reply_to=reply_list,
    )
    if tracking_token:
        html = _inject_tracking(html, tracking_token, _public_base())
    msg.attach_alternative(html, "text/html")
    msg.extra_headers = {
        "X-Mailer": "Rey CMS",
        "Sender": from_header,
        "List-Unsubscribe": f"<{unsubscribe_url}>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
    return msg


@shared_task(bind=True, max_retries=3, soft_time_limit=25 * 60)
def send_bulk_email_task(self, campaign_id: str):
    """
    Send all pending recipients for a campaign in the background.
    Batches of ~40 on one SMTP connection + short pause between batches.
    Safe for ~400 subscribers without blocking the API.
    """
    from .models import Newsletter, NewsletterRecipient

    try:
        campaign = (
            Newsletter.objects.select_related("company", "company__parent")
            .get(id=campaign_id)
        )
    except Newsletter.DoesNotExist:
        logger.error("Campaign %s not found", campaign_id)
        return {"ok": False, "error": "not_found"}

    company = campaign.company
    if campaign.send_as_parent and getattr(company, "parent_id", None):
        company = company.parent
    elif campaign.send_as_parent and getattr(company, "is_parent", False):
        company = company

    campaign.status = "sending"
    campaign.save(update_fields=["status"])

    pending = (
        NewsletterRecipient.objects.filter(newsletter=campaign, status="pending")
        .select_related("subscriber")
        .order_by("id")
    )
    total = pending.count()
    sent = 0
    failed = 0

    subject_tpl = campaign.subject
    html_tpl = campaign.html_content
    plain_tpl = campaign.plain_text or ""

    batch_msgs = []
    batch_recs = []

    def flush(connection):
        nonlocal sent, failed, batch_msgs, batch_recs
        if not batch_msgs:
            return
        for m in batch_msgs:
            m.connection = connection
        try:
            connection.send_messages(batch_msgs)
            now = timezone.now()
            for rec in batch_recs:
                rec.status = "sent"
                if hasattr(rec, "email") and not rec.email and sub:
                    rec.email = sub.email
                try:
                    from .models import EmailEvent
                    EmailEvent.objects.create(
                        newsletter=campaign,
                        recipient=rec,
                        email=getattr(sub, "email", "") or "",
                        event="sent",
                    )
                except Exception:
                    pass
                rec.sent_at = now
                rec.save(update_fields=["status", "sent_at"])
                sub = rec.subscriber
                if sub:
                    sub.last_email_sent_at = now
                    sub.total_emails_sent = (sub.total_emails_sent or 0) + 1
                    sub.save(update_fields=["last_email_sent_at", "total_emails_sent"])
                sent += 1
        except Exception as exc:
            logger.exception("Batch failed: %s", exc)
            for rec in batch_recs:
                rec.status = "failed"
                rec.error_message = str(exc)[:500]
                rec.save(update_fields=["status", "error_message"])
                failed += 1
        batch_msgs = []
        batch_recs = []

    try:
        with get_connection(fail_silently=False) as connection:
            connection.open()
            for rec in pending.iterator(chunk_size=BATCH_SIZE):
                sub = rec.subscriber
                if not sub or not sub.email:
                    rec.status = "failed"
                    rec.error_message = "Missing email"
                    rec.save(update_fields=["status", "error_message"])
                    failed += 1
                    continue
                base = _public_base().rstrip("/")
                unsub = f"{base}/unsubscribe/{rec.tracking_token}/"
                # Also inject per-recipient subscribe page URL
                subscribe_page = f"{base}/subscribe/?company={getattr(company, 'slug', '')}"
                try:
                    msg = _build_message(
                        company, sub, subject_tpl, html_tpl, plain_tpl, unsub,
                        tracking_token=rec.tracking_token,
                    )
                    batch_msgs.append(msg)
                    batch_recs.append(rec)
                except Exception as exc:
                    logger.exception("Build failed %s", getattr(sub, "email", "?"))
                    rec.status = "failed"
                    rec.error_message = str(exc)[:500]
                    rec.save(update_fields=["status", "error_message"])
                    failed += 1
                    continue

                if len(batch_msgs) >= BATCH_SIZE:
                    flush(connection)
                    time.sleep(BATCH_PAUSE)

            flush(connection)
    except Exception as exc:
        logger.exception("Campaign %s aborted", campaign_id)
        campaign.status = "failed"
        campaign.save(update_fields=["status"])
        raise

    campaign.total_sent = sent
    # total_failed may not exist on all schemas – use getattr safe update
    update_fields = ["total_sent", "status"]
    if hasattr(campaign, "total_failed"):
        campaign.total_failed = failed
        update_fields.append("total_failed")
    campaign.status = "sent" if failed == 0 else "sent"
    if hasattr(campaign, "sent_at"):
        campaign.sent_at = timezone.now()
        update_fields.append("sent_at")
    campaign.total_recipients = total
    if "total_recipients" not in update_fields:
        update_fields.append("total_recipients")
    campaign.save(update_fields=list(set(update_fields)))

    logger.info("Campaign %s done sent=%s failed=%s total=%s", campaign_id, sent, failed, total)
    return {"ok": True, "sent": sent, "failed": failed, "total": total}


@shared_task(bind=True, max_retries=3)
def send_newsletter_task(self, newsletter_id):
    """Backward-compatible entry: runs the same bulk path. """
    return send_bulk_email_task(str(newsletter_id))
