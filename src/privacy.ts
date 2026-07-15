export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (!local || !domain) return "invalid-email";
  return `${local.slice(0, 1)}***@${domain}`;
}
