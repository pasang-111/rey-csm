"""
Seed the built-in REY luxury email templates.

Usage:

    python manage.py seed_templates

The design is intentionally locked.

Administrators edit:
    - subject
    - message
    - event details

Administrators do NOT edit:
    - colours
    - logo
    - layout
    - typography
"""

from django.core.management.base import BaseCommand

from django.utils.text import slugify
from apps.companies.models import Company
from apps.templates_app.models import EmailTemplate


REY_LOGO = (
    "https://rey-corporate-group-2-4.vercel.app/"
    "Rey-Corp-Group.png"
)

REY_WEBSITE = (
    "https://reycorporate.com.au/"
)


SHELL = f"""
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8"/>

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
/>

<meta
    name="x-apple-disable-message-reformatting"
/>

<title>{{{{ subject }}}}</title>

</head>


<body
    style="
        margin:0;
        padding:0;
        background:#e9e8e4;
    "
>

<table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        background:#e9e8e4;
        padding:40px 14px;
    "
>

<tr>

<td align="center">


<table
    role="presentation"
    width="640"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        width:100%;
        max-width:640px;
        background:#ffffff;
    "
>


<!-- TOP GOLD LINE -->

<tr>

<td
    style="
        height:5px;
        background:#b99a61;
        font-size:0;
        line-height:0;
    "
>
</td>

</tr>


<!-- HEADER -->

<tr>

<td
    align="center"
    style="
        background:#111111;
        padding:38px 30px 42px;
    "
>

<a
    href="{REY_WEBSITE}"
    target="_blank"
    style="
        display:block;
        text-decoration:none;
    "
>

<img
    src="{REY_LOGO}"
    alt="REY Corporate Group"
    width="210"
    style="
        display:block;
        width:210px;
        max-width:80%;
        height:auto;
        margin:0 auto;
        border:0;
    "
/>

</a>


<div
    style="
        width:42px;
        height:1px;
        background:#b99a61;
        margin:25px auto 0;
    "
>
</div>

</td>

</tr>


<!-- CONTENT -->

<tr>

<td
    style="
        padding:54px 55px 48px;
    "
>


{{% if full_name %}}
<div
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:13px;
        color:#777777;
        margin-bottom:30px;
    "
>
    Dear {{{{ full_name }}}},
</div>
{{% endif %}}


<div
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:10px;
        font-weight:bold;
        letter-spacing:3px;
        color:#ad884b;
        text-transform:uppercase;
        margin-bottom:18px;
    "
>
    {{{{ email_eyebrow|default:"REY COMMUNICATIONS" }}}}
</div>


<h1
    style="
        margin:0;
        font-family:Georgia,'Times New Roman',serif;
        font-size:36px;
        line-height:1.22;
        font-weight:400;
        color:#151515;
    "
>
    {{{{ email_heading|default:"A message from REY." }}}}
</h1>


<table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        margin:28px 0 30px;
    "
>

<tr>

<td
    style="
        border-top:1px solid #dedad1;
        font-size:0;
        line-height:0;
    "
>
</td>

</tr>

</table>


<div
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:15px;
        line-height:1.9;
        color:#555555;
    "
>
    {{{{ body_content|safe }}}}
</div>


{{% if event.name %}}

<table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        margin:34px 0;
        background:#faf9f6;
        border:1px solid #ded8cd;
    "
>

<tr>

<td style="padding:30px;">

<div
    style="
        font-family:Georgia,'Times New Roman',serif;
        font-size:22px;
        color:#171717;
        margin-bottom:24px;
    "
>
    {{{{ event.name }}}}
</div>


{{% if event.date %}}

<div style="margin-bottom:18px;">

<div
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        font-weight:bold;
        letter-spacing:2px;
        color:#aa8750;
        text-transform:uppercase;
        margin-bottom:6px;
    "
>
    DATE
</div>

<div
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:14px;
        color:#292929;
    "
>
    {{{{ event.date }}}}
</div>

</div>

{{% endif %}}


{{% if event.time %}}

<div style="margin-bottom:18px;">

<div
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        font-weight:bold;
        letter-spacing:2px;
        color:#aa8750;
        text-transform:uppercase;
        margin-bottom:6px;
    "
>
    TIME
</div>

<div
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:14px;
        color:#292929;
    "
>
    {{{{ event.time }}}}
</div>

</div>

{{% endif %}}


{{% if event.location %}}

<div>

<div
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        font-weight:bold;
        letter-spacing:2px;
        color:#aa8750;
        text-transform:uppercase;
        margin-bottom:6px;
    "
>
    LOCATION
</div>

<div
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:14px;
        line-height:1.6;
        color:#292929;
    "
>
    {{{{ event.location }}}}
</div>

</div>

{{% endif %}}

</td>

</tr>

</table>

{{% endif %}}


{{% if email_secondary %}}

<div
    style="
        margin-top:22px;
        font-family:Arial,Helvetica,sans-serif;
        font-size:12px;
        line-height:1.7;
        color:#858585;
    "
>
    {{{{ email_secondary }}}}
</div>

{{% endif %}}


{{% if cta_url and cta_text %}}

<table
    role="presentation"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="margin:32px 0 12px;"
>

<tr>

<td style="background:#111111;">

<a
    href="{{{{ cta_url }}}}"
    target="_blank"
    style="
        display:inline-block;
        padding:16px 32px;
        color:#ffffff;
        text-decoration:none;
        font-family:Arial,Helvetica,sans-serif;
        font-size:10px;
        font-weight:bold;
        letter-spacing:2px;
        text-transform:uppercase;
    "
>
    {{{{ cta_text }}}}
</a>

</td>

</tr>

</table>

{{% endif %}}


<div
    style="
        margin-top:42px;
        font-family:Arial,Helvetica,sans-serif;
        font-size:12px;
        line-height:1.8;
        color:#777777;
    "
>

Kind regards,<br/>

<span
    style="
        font-family:Georgia,'Times New Roman',serif;
        font-size:17px;
        color:#1b1b1b;
    "
>
    The {{{{ company.name }}}} Team
</span>

</div>


</td>

</tr>


<!-- FOOTER -->

<tr>

<td
    align="center"
    style="
        background:#f7f5f1;
        padding:32px 30px;
        border-top:1px solid #e4dfd6;
    "
>

<a
    href="{REY_WEBSITE}"
    target="_blank"
    style="text-decoration:none;"
>

<img
    src="{REY_LOGO}"
    alt="REY Corporate Group"
    width="115"
    style="
        display:block;
        width:115px;
        max-width:50%;
        height:auto;
        margin:0 auto 18px;
        border:0;
    "
/>

</a>


<div
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:10px;
        line-height:1.7;
        color:#999999;
    "
>
    © {{{{ year }}}} {{{{ company.name }}}}.
    All rights reserved.
</div>


<div style="margin-top:10px;">

<a
    href="{REY_WEBSITE}"
    target="_blank"
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:10px;
        color:#777777;
        text-decoration:none;
    "
>
    reycorporate.com.au
</a>

</div>


<div style="margin-top:12px;">

<a
    href="{{{{ unsubscribe_url|default:'#' }}}}"
    style="
        font-family:Arial,Helvetica,sans-serif;
        font-size:9px;
        color:#999999;
        text-decoration:underline;
    "
>
    Unsubscribe
</a>

</div>

</td>

</tr>


<!-- BOTTOM GOLD -->

<tr>

<td
    style="
        height:5px;
        background:#b99a61;
        font-size:0;
        line-height:0;
    "
>
</td>

</tr>


</table>

</td>

</tr>

</table>

</body>

</html>
"""


DEFAULTS = [

    {
        "type": "thank_you_enquiry",
        "name": "Luxury Enquiry Thank You",
        "subject":
            "Thank you for your enquiry – {{ company.name }}",

        "eyebrow":
            "THANK YOU",

        "heading":
            "We have received your enquiry.",

        "body":
            (
                "Thank you for contacting "
                "<strong>{{ company.name }}</strong>. "
                "We have received your enquiry and "
                "our team will be in touch shortly."
            ),

        "button":
            "VISIT REY",

        "is_default":
            True,
    },


    {
        "type": "thank_you_registration",
        "name": "Luxury Registration",
        "subject":
            "Welcome to {{ company.name }}",

        "eyebrow":
            "WELCOME",

        "heading":
            "Welcome to REY.",

        "body":
            (
                "Thank you for registering with "
                "<strong>{{ company.name }}</strong>. "
                "You are now connected with our latest "
                "news, events and developments."
            ),

        "button":
            "EXPLORE REY",

        "is_default":
            True,
    },


    {
        "type": "invitation",
        "name": "Signature Event Invitation",
        "subject":
            "You are invited — {{ event.name }}",

        "eyebrow":
            "EXCLUSIVE INVITATION",

        "heading":
            "An occasion worth experiencing.",

        "body":
            (
                "We are delighted to invite you to an "
                "exclusive REY event. Join us for an "
                "evening of connection, conversation "
                "and exceptional experiences."
            ),

        "button":
            "RSVP NOW",

        "is_default":
            True,
    },


    {
        "type": "event_reminder",
        "name": "Event Reminder",
        "subject":
            "A reminder from REY — {{ event.name }}",

        "eyebrow":
            "EVENT REMINDER",

        "heading":
            "We look forward to seeing you.",

        "body":
            (
                "This is a gentle reminder that your "
                "REY event is approaching. We are "
                "delighted to have you joining us."
            ),

        "button":
            "VIEW EVENT",

        "is_default":
            True,
    },


    {
        "type": "thank_you_event",
        "name": "Teej Mahotsav 2026 Thank You",
        "subject":
            "Thank you for celebrating Teej Mahotsav 2026 with Rey Corporate Group",

        "eyebrow":
            "TEEJ MAHOTSAV 2026",

        "heading":
            "Thank you for being part of Teej Mahotsav 2026.",

        "body":
            (
                "Thank you for being part of Teej Mahotsav 2026 in Burwood "
                "and for participating in the Rey Corporate Group – Scan & Win Lucky Draw.<br><br>"
                "As the Title Sponsor, we were proud to support such a wonderful celebration "
                "and to see our Nepalese community come together in such great numbers. "
                "Congratulations once again to our two lucky draw winners, and a big thank you "
                "to everyone who visited us and participated.<br><br>"
                "We would also like to take this opportunity to introduce you to Rey Corporate Group.<br><br>"
                "<strong>Everything Property &amp; Beyond — Under One Group</strong><br><br>"
                "Rey Corporate Group brings together a growing network of businesses across real estate, "
                "construction, landscaping, property improvements, investment and development.<br><br>"
                "Whether you are buying your first home, selling an existing property, looking for an investment, "
                "building a new home or improving your property after construction, our goal is to make the journey "
                "easier by connecting these services under one group.<br><br>"
                "Through our group of companies, we can assist with:<br><br>"
                "<strong>Buy, Sell &amp; Rent</strong> — Residential property sales, purchases, property management "
                "and real estate services through Rey Properties.<br><br>"
                "<strong>Build Your Home</strong> — New homes, custom homes and construction solutions through "
                "Rey Homes, Sandstone Constructions and Stonegrove Homes.<br><br>"
                "<strong>Landscaping &amp; Fencing</strong> — Complete landscaping, fencing, decking, pergolas, "
                "retaining walls, turf, concreting and outdoor finishing through Rigid Landscaping.<br><br>"
                "<strong>After-Build Solutions</strong> — Built-in wardrobes, blinds, garage storage, epoxy flooring, "
                "alfresco kitchens/BBQs and other finishing solutions through After Build Solutions.<br><br>"
                "<strong>Investment &amp; Development</strong> — Property investment and development opportunities "
                "through Alpha Investment Group.<br><br>"
                "What makes Rey Corporate Group different is our ability to connect multiple property services "
                "within one network. From finding the property to building, landscaping, completing the finishing "
                "touches and exploring future investment opportunities, our businesses are here to support you "
                "at different stages of your property journey.<br><br>"
                "<strong>Let's Stay Connected</strong><br><br>"
                "If you are thinking about buying, selling, building, renting, investing, developing or improving "
                "your property, we would love the opportunity to have a conversation and see how one of our teams can assist.<br><br>"
                "www.reycorp.com.au<br><br>"
                "Thank you once again for celebrating Teej Mahotsav 2026 with us and for supporting Rey Corporate Group.<br><br>"
                "We look forward to staying connected with our community and hopefully being part of your next property journey."
            ),

        "button":
            "VISIT REY CORPORATE GROUP",

        "is_default":
            True,
    },


    {
        "type": "newsletter_base",
        "name": "REY Journal",
        "subject":
            "{{ company.name }} — The REY Journal",

        "eyebrow":
            "THE REY JOURNAL",

        "heading":
            "Ideas. People. Places.",

        "body":
            (
                "Welcome to the latest edition of the "
                "REY Journal. Discover our latest "
                "projects, company news, events and "
                "stories from across the REY group."
            ),

        "button":
            "READ MORE",

        "is_default":
            True,
    },


    {
        "type": "announcement",
        "name": "Luxury Announcement",
        "subject":
            "{{ company.name }} — Important Announcement",

        "eyebrow":
            "REY UPDATE",

        "heading":
            "Something worth sharing.",

        "body":
            (
                "We are pleased to share an important "
                "update from <strong>{{ company.name }}"
                "</strong>. Please read the full "
                "announcement below."
            ),

        "button":
            "READ ANNOUNCEMENT",

        "is_default":
            True,
    },


    {
        "type": "welcome",
        "name": "REY Welcome",
        "subject":
            "Welcome to {{ company.name }}",

        "eyebrow":
            "WELCOME TO REY",

        "heading":
            "A new connection begins.",

        "body":
            (
                "Thank you for connecting with "
                "<strong>{{ company.name }}</strong>. "
                "We are pleased to have you with us "
                "and look forward to sharing what is ahead."
            ),

        "button":
            "EXPLORE REY",

        "is_default":
            True,
    },


    {
        "type": "custom",
        "name": "Luxury Custom Message",
        "subject":
            "A message from {{ company.name }}",

        "eyebrow":
            "FROM REY",

        "heading":
            "A message from our team.",

        "body":
            "Write your message here.",

        "button":
            "VISIT REY",

        "is_default":
            False,
    },

]


class Command(BaseCommand):

    help = (
        "Seed the built-in REY luxury email templates "
        "for all active companies."
    )


    def handle(
        self,
        *args,
        **options
    ):

        created = 0
        updated = 0

        companies = Company.objects.filter(
            is_active=True
        )


        for company in companies:

            for item in DEFAULTS:

                html_body = (
                    SHELL
                    .replace(
                        "{{ email_eyebrow|default:\"REY COMMUNICATIONS\" }}",
                        item["eyebrow"],
                    )
                    .replace(
                        "{{ email_heading|default:\"A message from REY.\" }}",
                        item["heading"],
                    )
                    .replace(
                        "{{ body_content|safe }}",
                        item["body"],
                    )
                    .replace(
                        "{{ cta_text }}",
                        item["button"],
                    )
                )


                slug = slugify(f"{item['type']}-{item['name']}")[:220] or item["type"]

                template, was_created = (
                    EmailTemplate.objects.update_or_create(
                        company=company,
                        slug=slug,

                        defaults={
                            "type":
                                item["type"],

                            "name":
                                item["name"],

                            "subject":
                                item["subject"],

                            "html_body":
                                html_body,

                            "plain_text":
                                "",

                            "primary_color":
                                "#111111",

                            "secondary_color":
                                "#B99A61",

                            "header_bg":
                                "#111111",

                            "footer_bg":
                                "#F7F5F1",

                            "logo_settings": {
                                "source":
                                    "rey_corporate_fixed",

                                "url":
                                    REY_LOGO,

                                "link":
                                    REY_WEBSITE,

                                "width":
                                    210,

                                "align":
                                    "center",

                                "locked":
                                    True,
                            },

                            "is_default":
                                item["is_default"],

                            "is_active":
                                True,
                        },
                    )
                )


                if was_created:

                    created += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  + {company.name}: "
                            f"{item['name']}"
                        )
                    )

                else:

                    updated += 1

                    self.stdout.write(
                        f"  ↻ {company.name}: "
                        f"{item['name']}"
                    )


        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created {created}, "
                f"updated {updated} templates."
            )
        )