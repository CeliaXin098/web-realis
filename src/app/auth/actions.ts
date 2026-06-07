"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { buildAuthCallbackUrl, getPasswordValidationError, getRequestOrigin, sanitizeNextPath } from "@/lib/auth/flow";
import { createClient } from "@/lib/supabase/server";

function authErrorUrl(mode: "login" | "signup" | "forgot", message: string, next?: string) {
  const params = new URLSearchParams({
    mode,
    error: message,
  });
  const safeNext = sanitizeNextPath(next);
  if (safeNext !== "/reflect") params.set("next", safeNext);
  return `/auth?${params.toString()}`;
}

function readCredentials(formData: FormData) {
  return {
    confirmPassword: String(formData.get("confirmPassword") || ""),
    email: String(formData.get("email") || "").trim(),
    next: sanitizeNextPath(String(formData.get("next") || "")),
    password: String(formData.get("password") || ""),
  };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { email, next, password } = readCredentials(formData);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(authErrorUrl("login", error.message, next));
  redirect(next);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const { confirmPassword, email, next, password } = readCredentials(formData);
  const passwordError = getPasswordValidationError(password, confirmPassword);
  if (passwordError) redirect(authErrorUrl("signup", passwordError, next));

  const requestHeaders = await headers();
  const origin = getRequestOrigin(requestHeaders);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(origin, next),
    },
  });

  if (error) redirect(authErrorUrl("signup", error.message, next));

  if (!data.session) {
    const params = new URLSearchParams({
      email,
      next,
      type: "signup",
    });
    redirect(`/auth/check-email?${params.toString()}`);
  }

  redirect(next);
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    redirect(authErrorUrl("forgot", "请输入邮箱地址。"));
  }

  const requestHeaders = await headers();
  const origin = getRequestOrigin(requestHeaders);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildAuthCallbackUrl(origin, "/auth/reset"),
  });

  if (error) redirect(authErrorUrl("forgot", error.message));

  const params = new URLSearchParams({
    email,
    type: "recovery",
  });
  redirect(`/auth/check-email?${params.toString()}`);
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const passwordError = getPasswordValidationError(password, confirmPassword);

  if (passwordError) {
    const params = new URLSearchParams({ error: passwordError });
    redirect(`/auth/reset?${params.toString()}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const params = new URLSearchParams({ error: "重置链接已失效，请重新申请。" });
    redirect(`/auth/reset?${params.toString()}`);
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const params = new URLSearchParams({ error: error.message });
    redirect(`/auth/reset?${params.toString()}`);
  }

  const params = new URLSearchParams({ message: "密码已更新，请重新登录。" });
  redirect(`/auth?${params.toString()}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
