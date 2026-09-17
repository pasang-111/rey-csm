export interface Company {
  id: string;
  name: string;
  slug: string;
  short_name: string;
  is_parent: boolean;
  parent?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  domain?: string;
  from_email: string;
  is_active: boolean;
  tagline?: string;
}

export interface Subscriber {
  id: string;
  company: string;
  company_name?: string;
  full_name: string;
  email: string;
  phone?: string;
  home_address?: string;
  is_subscribed: boolean;
  source: string;
  tags: string[];
  created_at: string;
}

export interface Newsletter {
  id: string;
  company: string;
  company_name?: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed';
  recipient_filter: Record<string, any>;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  company: string;
  name: string;
  type: string;
  subject: string;
  html_body: string;
  is_default: boolean;
  logo_settings?: Record<string, any>;
}

export interface Enquiry {
  id: string;
  company: string;
  company_name?: string;
  full_name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  priority: string;
  thank_you_sent: boolean;
  created_at: string;
}
