export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  PUBLIC_BASE_URL: string;
  SUPPORT_EMAIL: string;
  HUBSPOT_CLIENT_ID: string;
  HUBSPOT_CLIENT_SECRET: string;
  TOKEN_ENCRYPTION_KEY: string;
  SESSION_SECRET: string;
  INDEXNOW_KEY?: string;
}

export interface ConnectionRow {
  id: string;
  hub_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: number;
  scopes: string;
  status: "needs_configuration" | "active" | "disconnected" | "error";
  created_at: string;
  updated_at: string;
}

export type FormFieldType = "short_text" | "long_text" | "email" | "multiple_choice" | "yes_no";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  hubspotProperty: string;
  placeholder?: string;
  options?: string[];
}

export interface FormRow {
  id: string;
  connection_id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  description: string;
  submit_label: string;
  success_message: string;
  fields_json: string;
  created_at: string;
  updated_at: string;
}

export interface HubSpotTokenResponse {
  token_type: string;
  refresh_token?: string;
  access_token: string;
  hub_id: number;
  scopes: string[];
  expires_in: number;
}
