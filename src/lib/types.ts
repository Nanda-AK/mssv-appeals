export type OrgType = "service_provider" | "client";
export type UserRole = "admin" | "staff" | "client";
export type Priority = "high" | "medium" | "low";

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  pan?: string;
  tan?: string;
  gst?: string;
  contact_person?: string;
  phone?: string;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  org_id: string;
  created_at?: string;
  organization?: Organization;
}

export interface Appeal {
  id: string;
  appeal_number: string;
  client_org_id: string;
  assigned_to?: string;
  status: string;
  case_type?: string;
  type_of_proceedings?: string;
  assessment_year?: string;
  section?: string;
  priority: Priority;
  outcome?: string;
  filing_date?: string;
  next_hearing_date?: string;
  notes?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  client_org?: { id: string; name: string };
  assigned_user?: { id: string; name: string };
}

export const APPEAL_STATUSES = [
  "Pending",
  "Hearing Scheduled",
  "Adjourned",
  "Decided - Allowed",
  "Decided - Dismissed",
  "Decided - Partially Allowed",
  "Withdrawn",
  "Appeal Filed",
  "Closed",
] as const;

export const PROCEEDINGS_TYPES = [
  "CIT(A)",
  "ITAT",
  "High Court",
  "Supreme Court",
  "DRP",
  "Revision u/s 263",
  "Revision u/s 264",
] as const;

export const CASE_TYPES = [
  "Income Tax",
  "TDS",
  "Transfer Pricing",
  "Penalty",
  "Other",
] as const;

export const PRIORITIES: Priority[] = ["high", "medium", "low"];
