const DEFAULT_NEXT_PATH = "/reflect";

export function sanitizeNextPath(input: string | null | undefined) {
  const value = (input || "").trim();

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return value;
}

export function buildAuthCallbackUrl(origin: string, nextPath: string | null | undefined) {
  const next = sanitizeNextPath(nextPath);
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function getPasswordValidationError(password: string, confirmPassword: string) {
  if (password.length < 8) {
    return "密码至少需要 8 位。";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "密码需同时包含字母和数字。";
  }

  if (password !== confirmPassword) {
    return "两次输入的密码不一致。";
  }

  return null;
}

export function getRequestOrigin(headers: Headers) {
  const forwardedProto = headers.get("x-forwarded-proto");
  const forwardedHost = headers.get("x-forwarded-host");
  const host = forwardedHost || headers.get("host");

  if (forwardedProto && host) {
    return `${forwardedProto}://${host}`;
  }

  if (host) {
    return host.includes("localhost") || host.startsWith("127.0.0.1") ? `http://${host}` : `https://${host}`;
  }

  return "http://localhost:3000";
}
