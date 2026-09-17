export type EmailTemplateType =
  | "thank_you_enquiry"
  | "thank_you_registration"
  | "thank_you_event"
  | "invitation"
  | "event_reminder"
  | "newsletter_base"
  | "announcement"
  | "welcome"
  | "custom";

export type EmailTemplatePreset = {
  type: EmailTemplateType;
  name: string;
  category: string;
  description: string;
  subject: string;

  eyebrow: string;
  heading: string;
  body: string;

  primaryButtonText: string;

  secondaryText?: string;

  showEventDetails?: boolean;
  showButton?: boolean;
};

export const REY_CORPORATE_LOGO =
  "https://www.reycorp.com.au/Rey-Corp-Group.png";

export const REY_CORPORATE_WEBSITE =
  "https://www.reycorp.com.au/";

/** Official company logos hosted on reycorp.com.au */
export const COMPANY_LOGOS: Record<string, string> = {
  "rey-corporate-group": "https://www.reycorp.com.au/Rey-Corp-Group.png",
  "rey-homes": "https://www.reycorp.com.au/logos/rey-homes.png",
  "rey-properties": "https://www.reycorp.com.au/logos/rey-properties.png",
  "sandstone-constructions": "https://www.reycorp.com.au/logos/sandstone.svg",
  "stonegrove-homes": "https://www.reycorp.com.au/logos/stone-grove-homes.png",
  "rigid-landscaping": "https://www.reycorp.com.au/logos/rigid-landscaping.png",
  "after-build-solutions": "https://www.reycorp.com.au/logos/after-build-solutions.png",
  "abs": "https://www.reycorp.com.au/logos/after-build-solutions.png",
  "alpha-investment": "https://www.reycorp.com.au/Rey-Corp-Group.png",
};

export function logoForCompany(slugOrName?: string | null): string {
  if (!slugOrName) return REY_CORPORATE_LOGO;
  const key = slugOrName.toLowerCase().trim();
  if (COMPANY_LOGOS[key]) return COMPANY_LOGOS[key];
  // fuzzy match by partial name
  for (const [slug, url] of Object.entries(COMPANY_LOGOS)) {
    if (key.includes(slug) || slug.includes(key.replace(/\s+/g, "-"))) return url;
  }
  if (key.includes("sandstone")) return COMPANY_LOGOS["sandstone-constructions"];
  if (key.includes("stonegrove") || key.includes("stone-grove")) return COMPANY_LOGOS["stonegrove-homes"];
  if (key.includes("rigid")) return COMPANY_LOGOS["rigid-landscaping"];
  if (key.includes("rey home")) return COMPANY_LOGOS["rey-homes"];
  if (key.includes("rey propert")) return COMPANY_LOGOS["rey-properties"];
  if (key.includes("after build") || key.includes("abs")) return COMPANY_LOGOS["after-build-solutions"];
  if (key.includes("alpha")) return COMPANY_LOGOS["alpha-investment"];
  return REY_CORPORATE_LOGO;
}

export const EMAIL_TEMPLATE_PRESETS: EmailTemplatePreset[] = [
  {
    type: "thank_you_enquiry",
    name: "Luxury Enquiry Thank You",
    category: "Thank You",
    description:
      "Elegant confirmation after a website enquiry.",

    subject:
      "Thank you for contacting {{ company.name }}",

    eyebrow: "THANK YOU",

    heading:
      "We have received your enquiry.",

    body:
      "Thank you for reaching out to {{ company.name }}. Our team has received your enquiry and will be in touch shortly.",

    primaryButtonText:
      "VISIT REY",

    secondaryText:
      "We appreciate your interest and look forward to speaking with you.",

    showButton: true,
  },

  {
    type: "thank_you_registration",
    name: "Luxury Registration",
    category: "Thank You",
    description:
      "Premium welcome after registration.",

    subject:
      "Welcome to {{ company.name }}",

    eyebrow: "WELCOME",

    heading:
      "Welcome to REY.",

    body:
      "Thank you for registering with {{ company.name }}. You are now connected with our latest news, events and developments.",

    primaryButtonText:
      "EXPLORE REY",

    secondaryText:
      "We look forward to keeping you connected with the REY experience.",

    showButton: true,
  },

  {
    type: "invitation",
    name: "Signature Event Invitation",
    category: "Events",
    description:
      "Luxury invitation for private and corporate events.",

    subject:
      "You are invited — {{ event.name }}",

    eyebrow:
      "EXCLUSIVE INVITATION",

    heading:
      "An occasion worth experiencing.",

    body:
      "We are delighted to invite you to an exclusive REY event. Join us for an evening of connection, conversation and exceptional experiences.",

    primaryButtonText:
      "RSVP NOW",

    secondaryText:
      "We look forward to welcoming you.",

    showEventDetails: true,
    showButton: true,
  },

  {
    type: "event_reminder",
    name: "Event Reminder",
    category: "Events",
    description:
      "Elegant reminder before an upcoming event.",

    subject:
      "A reminder from REY — {{ event.name }}",

    eyebrow:
      "EVENT REMINDER",

    heading:
      "We look forward to seeing you.",

    body:
      "This is a gentle reminder that your REY event is approaching. We are delighted to have you joining us.",

    primaryButtonText:
      "VIEW EVENT",

    secondaryText:
      "Please keep your event details handy and arrive a few minutes early.",

    showEventDetails: true,
    showButton: true,
  },

  {
    type: "thank_you_event",
    name: "Teej Mahotsav 2026 Thank You",
    category: "Events",
    description:
      "Thank you after Teej Mahotsav 2026 – Scan & Win Lucky Draw (Burwood).",

    subject:
      "Thank you for celebrating Teej Mahotsav 2026 with Rey Corporate Group",

    eyebrow:
      "TEEJ MAHOTSAV 2026",

    heading:
      "Thank you for being part of Teej Mahotsav 2026.",

    body:
      `Thank you for being part of Teej Mahotsav 2026 in Burwood and for participating in the Rey Corporate Group – Scan & Win Lucky Draw.

As the Title Sponsor, we were proud to support such a wonderful celebration and to see our Nepalese community come together in such great numbers. Congratulations once again to our two lucky draw winners, and a big thank you to everyone who visited us and participated.

We would also like to take this opportunity to introduce you to Rey Corporate Group.

Everything Property & Beyond — Under One Group

Rey Corporate Group brings together a growing network of businesses across real estate, construction, landscaping, property improvements, investment and development.

Whether you are buying your first home, selling an existing property, looking for an investment, building a new home or improving your property after construction, our goal is to make the journey easier by connecting these services under one group.

Through our group of companies, we can assist with:

Buy, Sell & Rent
Residential property sales, purchases, property management and real estate services through Rey Properties.

Build Your Home
New homes, custom homes and construction solutions through our building companies — Rey Homes, Sandstone Constructions and Stonegrove Homes.

Landscaping & Fencing
Complete landscaping, fencing, decking, pergolas, retaining walls, turf, concreting and outdoor finishing through Rigid Landscaping.

After-Build Solutions
Helping complete and upgrade your home with services such as built-in wardrobes, blinds, garage storage, epoxy flooring, alfresco kitchens/BBQs and other finishing solutions through After Build Solutions.

Investment & Development
Property investment and development opportunities through Alpha Investment Group.

What makes Rey Corporate Group different is our ability to connect multiple property services within one network. From finding the property to building, landscaping, completing the finishing touches and exploring future investment opportunities, our businesses are here to support you at different stages of your property journey.

Let's Stay Connected

If you are thinking about buying, selling, building, renting, investing, developing or improving your property, we would love the opportunity to have a conversation and see how one of our teams can assist.

www.reycorp.com.au

Thank you once again for celebrating Teej Mahotsav 2026 with us and for supporting Rey Corporate Group.

We look forward to staying connected with our community and hopefully being part of your next property journey.`,

    primaryButtonText:
      "VISIT REY CORPORATE GROUP",

    secondaryText:
      "Everything Property & Beyond — Under One Group",

    showButton: true,
  },

  {
    type: "newsletter_base",
    name: "REY Journal",
    category: "Newsletter",
    description:
      "Editorial-style luxury newsletter.",

    subject:
      "{{ company.name }} — The REY Journal",

    eyebrow:
      "THE REY JOURNAL",

    heading:
      "Ideas. People. Places.",

    body:
      "Welcome to the latest edition of the REY Journal. Discover our latest projects, company news, events and stories from across the REY group.",

    primaryButtonText:
      "READ MORE",

    secondaryText:
      "Curated news and stories from across REY.",

    showButton: true,
  },

  {
    type: "announcement",
    name: "Luxury Announcement",
    category: "Corporate",
    description:
      "Premium company announcement.",

    subject:
      "{{ company.name }} — Important Announcement",

    eyebrow:
      "REY UPDATE",

    heading:
      "Something worth sharing.",

    body:
      "We are pleased to share an important update from {{ company.name }}. Please read the full announcement below.",

    primaryButtonText:
      "READ ANNOUNCEMENT",

    secondaryText:
      "Thank you for staying connected with REY.",

    showButton: true,
  },

  {
    type: "welcome",
    name: "REY Welcome",
    category: "Corporate",
    description:
      "Luxury first-touch welcome email.",

    subject:
      "Welcome to {{ company.name }}",

    eyebrow:
      "WELCOME TO REY",

    heading:
      "A new connection begins.",

    body:
      "Thank you for connecting with {{ company.name }}. We are pleased to have you with us and look forward to sharing what is ahead.",

    primaryButtonText:
      "EXPLORE REY",

    secondaryText:
      "Stay connected with the REY group.",

    showButton: true,
  },

  {
    type: "custom",
    name: "Brand New Custom Template",
    category: "Custom",
    description:
      "Start from a blank luxury canvas. Full control: logos, colours, copy, CTA, event block, subscribe & unsubscribe links.",

    subject:
      "A message from {{ company.name }}",

    eyebrow:
      "FROM REY",

    heading:
      "Your headline here.",

    body:
      "Write your full message here. You can use merge tags such as {{ full_name }} and {{ company.name }}.",

    primaryButtonText:
      "VISIT REY",

    secondaryText:
      "Thank you for staying connected with REY.",

    showButton: true,
    showEventDetails: false,
  },
];

export function getTemplatePreset(
  type: EmailTemplateType
): EmailTemplatePreset {
  return (
    EMAIL_TEMPLATE_PRESETS.find(
      (template) => template.type === type
    ) || EMAIL_TEMPLATE_PRESETS[0]
  );
}