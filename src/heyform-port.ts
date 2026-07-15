/*
 * Adapted field-kind and plain-answer concepts from HeyForm.
 * Upstream: https://github.com/heyform/heyform
 * Snapshot: 4bfca60ee1bbc215dc308bd918a50c6c8dfe77ab
 * License: GNU AGPL v3.0. Modifications: reduced to the field kinds used by
 * this HubSpot-focused Cloudflare port and added strict option validation.
 */
export const FIELD_KINDS = ["short_text", "long_text", "email", "multiple_choice", "yes_no"] as const;
export type PortedFieldKind = (typeof FIELD_KINDS)[number];

export function normalizePlainAnswer(kind: PortedFieldKind, value: unknown, options: string[] = []): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (kind === "yes_no") {
    if (typeof value === "boolean") return value ? "true" : "false";
    if (value === "true" || value === "false") return value;
    return undefined;
  }
  const answer = String(value).trim();
  if (!answer) return undefined;
  if (kind === "multiple_choice" && !options.includes(answer)) return undefined;
  return answer;
}
