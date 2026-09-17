import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("newsletters", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="newsletterrecipient",
            name="email",
            field=models.EmailField(blank=True, help_text="Denormalised for logs", max_length=254),
        ),
        migrations.AddField(
            model_name="newsletterrecipient",
            name="open_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="newsletterrecipient",
            name="click_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.CreateModel(
            name="EmailEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("email", models.EmailField(blank=True, max_length=254)),
                (
                    "event",
                    models.CharField(
                        choices=[
                            ("queued", "Queued"),
                            ("sent", "Sent"),
                            ("failed", "Failed"),
                            ("opened", "Opened"),
                            ("clicked", "Clicked"),
                            ("bounced", "Bounced"),
                            ("unsubscribed", "Unsubscribed"),
                        ],
                        db_index=True,
                        max_length=20,
                    ),
                ),
                ("detail", models.CharField(blank=True, max_length=500)),
                ("meta", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "newsletter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="events",
                        to="newsletters.newsletter",
                    ),
                ),
                (
                    "recipient",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="events",
                        to="newsletters.newsletterrecipient",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="emailevent",
            index=models.Index(fields=["newsletter", "event"], name="newsletters_newslet_evt_idx"),
        ),
        migrations.AddIndex(
            model_name="emailevent",
            index=models.Index(fields=["-created_at"], name="newsletters_created_evt_idx"),
        ),
    ]
