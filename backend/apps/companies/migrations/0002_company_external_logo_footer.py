from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("companies", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="company",
            name="external_logo_url",
            field=models.URLField(
                blank=True,
                help_text="Public logo URL e.g. https://www.reycorp.com.au/logos/rey-homes.png",
            ),
        ),
        migrations.AddField(
            model_name="company",
            name="footer_text",
            field=models.CharField(blank=True, max_length=500),
        ),
    ]
