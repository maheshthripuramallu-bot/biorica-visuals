export function safeRedirect(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/admin";
  if (value.startsWith("/auth") || value.startsWith("/reset-password")) return "/admin";
  return value;
}