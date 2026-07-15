import { decryptSecret, encryptSecret } from "./crypto";
import type { ConnectionRow, Env, HubSpotTokenResponse } from "./types";

const TOKEN_ENDPOINT = "https://api.hubapi.com/oauth/2026-03/token";

async function parseFailure(response: Response): Promise<Error> {
  const text = (await response.text()).slice(0, 2_000);
  return new Error(`HubSpot API ${response.status}: ${text || response.statusText}`);
}

export function authorizationUrl(env: Env, state: string): string {
  const url = new URL("https://app.hubspot.com/oauth/authorize");
  url.searchParams.set("client_id", env.HUBSPOT_CLIENT_ID);
  url.searchParams.set("redirect_uri", `${env.PUBLIC_BASE_URL}/api/oauth/callback`);
  url.searchParams.set("scope", "oauth crm.objects.contacts.read crm.objects.contacts.write");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeAuthorizationCode(env: Env, code: string): Promise<HubSpotTokenResponse> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${env.PUBLIC_BASE_URL}/api/oauth/callback`,
      client_id: env.HUBSPOT_CLIENT_ID,
      client_secret: env.HUBSPOT_CLIENT_SECRET,
    }),
  });
  if (!response.ok) throw await parseFailure(response);
  return response.json<HubSpotTokenResponse>();
}

async function refreshAccessToken(env: Env, connection: ConnectionRow): Promise<string> {
  const refreshToken = await decryptSecret(connection.refresh_token_encrypted, env.TOKEN_ENCRYPTION_KEY);
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.HUBSPOT_CLIENT_ID,
      client_secret: env.HUBSPOT_CLIENT_SECRET,
    }),
  });
  if (!response.ok) throw await parseFailure(response);
  const token = await response.json<HubSpotTokenResponse>();
  const encryptedAccess = await encryptSecret(token.access_token, env.TOKEN_ENCRYPTION_KEY);
  const encryptedRefresh = token.refresh_token
    ? await encryptSecret(token.refresh_token, env.TOKEN_ENCRYPTION_KEY)
    : connection.refresh_token_encrypted;
  await env.DB.prepare(`
      UPDATE connections
      SET access_token_encrypted = ?, refresh_token_encrypted = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(encryptedAccess, encryptedRefresh, Math.floor(Date.now() / 1000) + token.expires_in, connection.id)
    .run();
  return token.access_token;
}

export async function getAccessToken(env: Env, connection: ConnectionRow): Promise<string> {
  if (connection.token_expires_at > Math.floor(Date.now() / 1000) + 120) {
    return decryptSecret(connection.access_token_encrypted, env.TOKEN_ENCRYPTION_KEY);
  }
  return refreshAccessToken(env, connection);
}

async function hubspotFetch(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let response: Response | undefined;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    response = await fetch(url, init);
    if (response.status !== 429 && response.status < 500) return response;
    if (attempt < attempts) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1_000, attempt * 250)));
    }
  }
  return response!;
}

export async function upsertContact(
  env: Env,
  connection: ConnectionRow,
  properties: Record<string, string>,
): Promise<string> {
  const token = await getAccessToken(env, connection);
  const email = properties.email;
  if (!email) throw new Error("HubSpot contact email is required");
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const update = await hubspotFetch(
    `https://api.hubapi.com/crm/objects/2026-03/contacts/${encodeURIComponent(email)}?idProperty=email`,
    { method: "PATCH", headers, body: JSON.stringify({ properties }) },
  );
  if (update.ok) return ((await update.json()) as { id: string }).id;
  if (update.status !== 404) throw await parseFailure(update);
  const create = await hubspotFetch("https://api.hubapi.com/crm/objects/2026-03/contacts", {
    method: "POST",
    headers,
    body: JSON.stringify({ properties }),
  });
  if (!create.ok) throw await parseFailure(create);
  return ((await create.json()) as { id: string }).id;
}

export async function uninstallHubSpotApp(env: Env, connection: ConnectionRow): Promise<void> {
  const token = await getAccessToken(env, connection);
  const response = await fetch("https://api.hubapi.com/appinstalls/2026-03/external-install", {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 404) throw await parseFailure(response);
}
