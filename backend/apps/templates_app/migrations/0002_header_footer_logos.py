from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("templates_app", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="emailtemplate",
            name="header_logo",
            field=models.ImageField(
                blank=True,
                help_text="Logo shown in the email header (PNG/SVG preferred)",
                null=True,
                upload_to="email-logos/header/%Y/%m/",
            ),
        ),
        migrations.AddField(
            model_name="emailtemplate",
            name="footer_logo",
            field=models.ImageField(
                blank=True,
                help_text="Logo shown in the email footer",
                null=True,
                upload_to="email-logos/footer/%Y/%m/",
            ),
        ),
    ]
