import { Hono } from "hono";
import type { Context, Next } from "hono";
import { z } from "zod";
import { builderDashboardPage, notFoundFormPage, publicFormPage } from "./builder-pages";
import { createSessionCookie, encryptSecret, randomToken, sha256Hex, verifySessionCookie } from "./crypto";
import { authorizationUrl, exchangeAuthorizationCode, uninstallHubSpotApp, upsertContact } from "./hubspot";
import { FIELD_KINDS, normalizePlainAnswer } from "./heyform-port";
import { maskEmail } from "./privacy";
import { landingPage, openSourcePage, pricingPage, privacyPage, setupPage, supportPage, termsPage } from "./marketing-pages";
import type { ConnectionRow, Env, FormField, FormRow } from "./types";

type Variables = { connection: ConnectionRow };
type AppEnvironment = { Bindings: Env; Variables: Variables };
const app = new Hono<AppEnvironment>();

const fieldSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  type: z.enum(FIELD_KINDS),
  required: z.boolean(),
  hubspotProperty: z.string().trim().max(100).regex(/^[A-Za-z0-9_]*$/u, "Use a HubSpot internal property name"),
  placeholder: z.string().trim().max(160).optional().default(""),
  options: z.array(z.string().trim().min(1).max(100)).max(30).optional().default([]),
});

const formSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().default(""),
  status: z.enum(["draft", "published"]),
  submitLabel: z.string().trim().min(1).max(50),
  successMessage: z.string().trim().min(1).max(200),
  fields: z.array(fieldSchema).min(1).max(40),
}).superRefine((form, context) => {
  const ids = new Set<string>();
  for (const [index, field] of form.fields.entries()) {
    if (ids.has(field.id)) context.addIssue({ code: "custom", path: ["fields", index, "id"], message: "Question IDs must be unique" });
    ids.add(field.id);
    if (field.type === "multiple_choice" && field.options.length < 1) context.addIssue({ code: "custom", path: ["fields", index, "options"], message: "A multiple-choice question needs at least one option" });
  }
  if (form.status === "published" && !form.fields.some((field) => field.hubspotProperty === "email" && field.type === "email" && field.required)) {
    context.addIssue({ code: "custom", path: ["fields"], message: "Published forms need a required email question mapped to the email property" });
  }
});

const submissionSchema = z.object({
  submissionKey: z.string().min(8).max(100),
  startedAt: z.number().int().positive(),
  website: z.string().max(500).optional().default(""),
  values: z.record(z.string(), z.union([z.string().max(10_000), z.boolean(), z.number()])),
});

app.use("*", async (context, next) => {
  await next();
  const isPublicForm = new URL(context.req.url).pathname.startsWith("/f/");
  context.res.headers.set("x-content-type-options", "nosniff");
  context.res.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  context.res.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  context.res.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  if (!isPublicForm) context.res.headers.set("x-frame-options", "DENY");
  context.res.headers.set("content-security-policy", `default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors ${isPublicForm ? "*" : "'none'"}; base-uri 'self'; form-action 'self'`);
});

app.onError((error, context) => {
  console.error(JSON.stringify({ event: "request_error", path: new URL(context.req.url).pathname, message: error.message }));
  if (error instanceof z.ZodError) return context.json({ error: error.issues[0]?.message ?? "Invalid input" }, 400);
  if (new URL(context.req.url).pathname.startsWith("/api/")) return context.json({ error: "The request could not be completed" }, 500);
  return context.text("Internal Server Error", 500);
});

app.get("/", (context) => context.html(landingPage()));
app.get("/app", (context) => context.html(builderDashboardPage()));
app.get("/demo", (context) => context.html(builderDashboardPage(true)));
app.get("/demo/form", (context) => {
  const fields: FormField[] = [
    { id: "work_email", label: "Work email", type: "email", required: true, hubspotProperty: "email", placeholder: "you@company.com", options: [] },
    { id: "first_name", label: "First name", type: "short_text", required: false, hubspotProperty: "firstname", placeholder: "Ada", options: [] },
    { id: "goal", label: "What would you like help with?", type: "multiple_choice", required: true, hubspotProperty: "lead_goal", options: ["Sales", "Support", "Partnership"] },
  ];
  const form: FormRow = { id: "demo", connection_id: "demo", title: "Northstar lead form", slug: "northstar-lead-form", status: "published", description: "Tell us about your next project.", submit_label: "Start the conversation", success_message: "Thanks — we’ll be in touch.", fields_json: JSON.stringify(fields), created_at: "", updated_at: "" };
  return context.html(publicFormPage(form, fields, true));
});
app.get("/docs/setup", (context) => context.html(setupPage()));
app.get("/pricing", (context) => context.html(pricingPage()));
app.get("/privacy", (context) => context.html(privacyPage()));
app.get("/terms", (context) => context.html(termsPage()));
app.get("/support", (context) => context.html(supportPage()));
app.get("/open-source", (context) => context.html(openSourcePage()));
app.get("/robots.txt", (context) => context.text(`User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /api/\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: ${context.env.PUBLIC_BASE_URL}/sitemap.xml\n`));
app.get("/sitemap.xml", (context) => context.body(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${context.env.PUBLIC_BASE_URL}/</loc></url><url><loc>${context.env.PUBLIC_BASE_URL}/demo</loc></url><url><loc>${context.env.PUBLIC_BASE_URL}/docs/setup</loc></url><url><loc>${context.env.PUBLIC_BASE_URL}/pricing</loc></url><url><loc>${context.env.PUBLIC_BASE_URL}/privacy</loc></url><url><loc>${context.env.PUBLIC_BASE_URL}/terms</loc></url><url><loc>${context.env.PUBLIC_BASE_URL}/support</loc></url><url><loc>${context.env.PUBLIC_BASE_URL}/open-source</loc></url></urlset>`, 200, { "content-type": "application/xml; charset=utf-8" }));

app.get("/api/health", async (context) => {
  const database = await context.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return context.json({ ok: database?.ok === 1, service: "form-builder-typeform-alternative", mode: "self-contained", oauthConfigured: Boolean(context.env.HUBSPOT_CLIENT_ID && context.env.HUBSPOT_CLIENT_SECRET) });
});

app.get("/api/oauth/start", async (context) => {
  if (!context.env.HUBSPOT_CLIENT_ID || !context.env.HUBSPOT_CLIENT_SECRET) return context.json({ error: "HubSpot OAuth is being configured" }, 503);
  const state = randomToken(32);
  await context.env.DB.prepare("INSERT INTO oauth_states (state, expires_at) VALUES (?, ?)").bind(state, Math.floor(Date.now() / 1000) + 600).run();
  context.header("set-cookie", `oauth_state=${state}; Path=/api/oauth/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return context.redirect(authorizationUrl(context.env, state));
});

app.get("/api/oauth/callback", async (context) => {
  const code = context.req.query("code");
  const state = context.req.query("state");
  if (!code || !state) return context.json({ error: "Missing OAuth code or state" }, 400);
  const cookieState = context.req.header("cookie")?.split(/;\s*/u).find((part) => part.startsWith("oauth_state="))?.slice("oauth_state=".length);
  if (!cookieState || cookieState !== state) return context.json({ error: "OAuth browser state mismatch" }, 400);
  context.header("set-cookie", "oauth_state=; Path=/api/oauth/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  const now = Math.floor(Date.now() / 1000);
  const savedState = await context.env.DB.prepare("SELECT expires_at FROM oauth_states WHERE state = ?").bind(state).first<{ expires_at: number }>();
  await context.env.DB.prepare("DELETE FROM oauth_states WHERE state = ? OR expires_at < ?").bind(state, now).run();
  if (!savedState || savedState.expires_at < now) return context.json({ error: "OAuth state expired" }, 400);
  const token = await exchangeAuthorizationCode(context.env, code);
  if (!token.refresh_token) throw new Error("HubSpot did not provide a refresh token");
  const hubId = String(token.hub_id);
  const existing = await context.env.DB.prepare("SELECT id FROM connections WHERE hub_id = ?").bind(hubId).first<{ id: string }>();
  const connectionId = existing?.id ?? crypto.randomUUID();
  const accessEncrypted = await encryptSecret(token.access_token, context.env.TOKEN_ENCRYPTION_KEY);
  const refreshEncrypted = await encryptSecret(token.refresh_token, context.env.TOKEN_ENCRYPTION_KEY);
  await context.env.DB.prepare(`INSERT INTO connections (id, hub_id, access_token_encrypted, refresh_token_encrypted, token_expires_at, scopes, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
    ON CONFLICT(hub_id) DO UPDATE SET access_token_encrypted = excluded.access_token_encrypted, refresh_token_encrypted = excluded.refresh_token_encrypted,
      token_expires_at = excluded.token_expires_at, scopes = excluded.scopes, status = 'active', updated_at = CURRENT_TIMESTAMP`)
    .bind(connectionId, hubId, accessEncrypted, refreshEncrypted, now + token.expires_in, JSON.stringify(token.scopes)).run();
  context.header("set-cookie", await createSessionCookie(hubId, context.env.SESSION_SECRET));
  return context.redirect("/app?connected=1");
});

async function requireConnection(context: Context<AppEnvironment>, next: Next): Promise<Response | void> {
  const hubId = await verifySessionCookie(context.req.header("cookie"), context.env.SESSION_SECRET);
  if (!hubId) return context.json({ error: "Authentication required" }, 401);
  const connection = await context.env.DB.prepare("SELECT * FROM connections WHERE hub_id = ?").bind(hubId).first<ConnectionRow>();
  if (!connection) return context.json({ error: "Connection not found" }, 401);
  context.set("connection", connection);
  await next();
}

function serializeForm(row: FormRow): Record<string, unknown> {
  return { id: row.id, title: row.title, slug: row.slug, status: row.status, description: row.description, submitLabel: row.submit_label, successMessage: row.success_message, fields: JSON.parse(row.fields_json) as FormField[], createdAt: row.created_at, updatedAt: row.updated_at };
}

function makeSlug(title: string): string {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 52) || "form";
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

app.use("/api/state", requireConnection);
app.use("/api/manage/*", requireConnection);
app.use("/api/disconnect", requireConnection);

app.get("/api/state", async (context) => {
  const connection = context.get("connection");
  const [forms, events] = await Promise.all([
    context.env.DB.prepare("SELECT * FROM forms WHERE connection_id = ? ORDER BY updated_at DESC").bind(connection.id).all<FormRow>(),
    context.env.DB.prepare(`SELECT s.email_preview, s.hubspot_contact_id, s.status, s.error_message, s.created_at, f.title AS form_title
      FROM form_submissions s JOIN forms f ON f.id = s.form_id WHERE s.connection_id = ? ORDER BY s.created_at DESC LIMIT 20`).bind(connection.id).all(),
  ]);
  return context.json({ hubId: connection.hub_id, status: connection.status, forms: forms.results.map(serializeForm), events: events.results });
});

app.post("/api/manage/forms", async (context) => {
  const connection = context.get("connection");
  const input = formSchema.parse(await context.req.json());
  const id = crypto.randomUUID();
  await context.env.DB.prepare(`INSERT INTO forms (id, connection_id, title, slug, status, description, submit_label, success_message, fields_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, connection.id, input.title, makeSlug(input.title), input.status, input.description, input.submitLabel, input.successMessage, JSON.stringify(input.fields)).run();
  const row = await context.env.DB.prepare("SELECT * FROM forms WHERE id = ?").bind(id).first<FormRow>();
  return context.json({ form: serializeForm(row!) }, 201);
});

app.put("/api/manage/forms/:id", async (context) => {
  const connection = context.get("connection");
  const input = formSchema.parse(await context.req.json());
  const result = await context.env.DB.prepare(`UPDATE forms SET title = ?, status = ?, description = ?, submit_label = ?, success_message = ?, fields_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND connection_id = ?`)
    .bind(input.title, input.status, input.description, input.submitLabel, input.successMessage, JSON.stringify(input.fields), context.req.param("id"), connection.id).run();
  if (!result.meta.changes) return context.json({ error: "Form not found" }, 404);
  const row = await context.env.DB.prepare("SELECT * FROM forms WHERE id = ?").bind(context.req.param("id")).first<FormRow>();
  return context.json({ form: serializeForm(row!) });
});

app.delete("/api/manage/forms/:id", async (context) => {
  const connection = context.get("connection");
  const result = await context.env.DB.prepare("DELETE FROM forms WHERE id = ? AND connection_id = ?").bind(context.req.param("id"), connection.id).run();
  if (!result.meta.changes) return context.json({ error: "Form not found" }, 404);
  return context.json({ ok: true });
});

app.get("/f/:slug", async (context) => {
  const form = await context.env.DB.prepare("SELECT * FROM forms WHERE slug = ? AND status = 'published'").bind(context.req.param("slug")).first<FormRow>();
  if (!form) return context.html(notFoundFormPage(), 404);
  return context.html(publicFormPage(form, JSON.parse(form.fields_json) as FormField[]));
});

app.post("/api/forms/:id/submit", async (context) => {
  const contentLength = Number(context.req.header("content-length") ?? "0");
  if (contentLength > 200_000) return context.json({ error: "Submission is too large" }, 413);
  const input = submissionSchema.parse(await context.req.json());
  if (input.website) return context.json({ ok: true }, 202);
  if (Date.now() - input.startedAt < 400 || Date.now() - input.startedAt > 86_400_000) return context.json({ error: "Please reload the form and try again" }, 429);
  const row = await context.env.DB.prepare(`SELECT f.*, c.hub_id, c.access_token_encrypted, c.refresh_token_encrypted, c.token_expires_at, c.scopes, c.status AS connection_status,
      c.created_at AS connection_created_at, c.updated_at AS connection_updated_at
    FROM forms f JOIN connections c ON c.id = f.connection_id WHERE f.id = ? AND f.status = 'published' AND c.status = 'active'`)
    .bind(context.req.param("id")).first<Record<string, unknown>>();
  if (!row) return context.json({ error: "Form not found" }, 404);
  const existing = await context.env.DB.prepare("SELECT status FROM form_submissions WHERE form_id = ? AND submission_key = ?").bind(String(row.id), input.submissionKey).first<{ status: string }>();
  if (existing) return context.json({ ok: true, duplicate: true }, 202);
  const fields = JSON.parse(String(row.fields_json)) as FormField[];
  const properties: Record<string, string> = {};
  for (const field of fields) {
    const answer = normalizePlainAnswer(field.type, input.values[field.id], field.options);
    if (field.required && answer === undefined) return context.json({ error: `${field.label} is required` }, 400);
    if (answer !== undefined && field.hubspotProperty) properties[field.hubspotProperty] = answer;
  }
  if (!properties.email || !/^\S+@\S+\.\S+$/u.test(properties.email)) return context.json({ error: "A valid email address is required" }, 400);
  const submissionId = crypto.randomUUID();
  const payloadHash = await sha256Hex(JSON.stringify(input.values));
  await context.env.DB.prepare(`INSERT INTO form_submissions (id, form_id, connection_id, submission_key, payload_hash, email_preview, status)
    VALUES (?, ?, ?, ?, ?, ?, 'processing')`).bind(submissionId, String(row.id), String(row.connection_id), input.submissionKey, payloadHash, maskEmail(properties.email)).run();
  const connection: ConnectionRow = {
    id: String(row.connection_id), hub_id: String(row.hub_id), access_token_encrypted: String(row.access_token_encrypted), refresh_token_encrypted: String(row.refresh_token_encrypted),
    token_expires_at: Number(row.token_expires_at), scopes: String(row.scopes), status: "active",
    created_at: String(row.connection_created_at), updated_at: String(row.connection_updated_at),
  };
  try {
    const contactId = await upsertContact(context.env, connection, properties);
    await context.env.DB.prepare("UPDATE form_submissions SET status = 'success', hubspot_contact_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(contactId, submissionId).run();
    return context.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown sync failure";
    await context.env.DB.prepare("UPDATE form_submissions SET status = 'failed', error_code = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(error instanceof Error ? error.name : "Error", message, submissionId).run();
    return context.json({ error: "Your response could not be synced. Please try again." }, 503);
  }
});

app.post("/api/disconnect", async (context) => {
  const connection = context.get("connection");
  await uninstallHubSpotApp(context.env, connection);
  await context.env.DB.prepare("DELETE FROM connections WHERE id = ?").bind(connection.id).run();
  context.header("set-cookie", "fb_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return context.json({ ok: true });
});

export default app;
