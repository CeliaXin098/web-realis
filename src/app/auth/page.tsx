import Link from "next/link";
import { requestPasswordReset, signIn, signUp } from "./actions";

type AuthMode = "login" | "signup" | "forgot";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const mode: AuthMode = params.mode === "signup" ? "signup" : params.mode === "forgot" ? "forgot" : "login";
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const next = params.next || "/reflect";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#7b927f]">私密账号</p>
        <h1 className="mt-2 text-4xl font-semibold">{isSignup ? "注册 Realis" : isForgot ? "找回密码" : "登录 Realis"}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">
          你的记录默认只对你自己可见。登录后，AI 觉察、记忆画廊和人际罗盘都会保存到你的账号里。
        </p>
      </div>

      {params.message ? (
        <p className="mb-5 rounded-lg border border-[#cddfce] bg-[#f5fbf6] p-3 text-sm text-[#47604c]">{params.message}</p>
      ) : null}

      {params.error ? (
        <p className="mb-5 rounded-lg border border-[#e7c7bd] bg-[#fff7f3] p-3 text-sm text-[#8a4b39]">
          {isSignup ? "注册失败：" : isForgot ? "发送失败：" : "登录失败："}
          {params.error}
        </p>
      ) : null}

      <form action={isSignup ? signUp : isForgot ? requestPasswordReset : signIn} className="rounded-lg border border-[#d9e1dc] bg-white p-6 shadow-sm">
        <input name="next" type="hidden" value={next} />

        <label className="block text-sm font-medium text-muted" htmlFor="email">
          邮箱
        </label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-md border border-[#d9e1dc] px-3 py-3 outline-none focus:border-[#7b927f]"
          id="email"
          name="email"
          required
          type="email"
        />

        {!isForgot ? (
          <>
            <label className="mt-4 block text-sm font-medium text-muted" htmlFor="password">
              密码
            </label>
            <input
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="mt-2 w-full rounded-md border border-[#d9e1dc] px-3 py-3 outline-none focus:border-[#7b927f]"
              id="password"
              minLength={isSignup ? 8 : 6}
              name="password"
              required
              type="password"
            />
          </>
        ) : null}

        {isSignup ? (
          <>
            <label className="mt-4 block text-sm font-medium text-muted" htmlFor="confirmPassword">
              再输一次密码
            </label>
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-md border border-[#d9e1dc] px-3 py-3 outline-none focus:border-[#7b927f]"
              id="confirmPassword"
              minLength={8}
              name="confirmPassword"
              required
              type="password"
            />
            <p className="mt-3 text-xs leading-6 text-muted">密码至少 8 位，并同时包含字母和数字。</p>
          </>
        ) : null}

        <button className="mt-6 w-full rounded-md bg-[#7b927f] px-4 py-3 font-medium text-white" type="submit">
          {isSignup ? "注册" : isForgot ? "发送重置邮件" : "登录"}
        </button>
      </form>

      <div className="mt-5 rounded-lg border border-[#d9e1dc] bg-[#f7faf8] p-4 text-sm leading-6 text-muted">
        {isSignup ? (
          <p>
            已有账号？
            <Link className="font-medium text-[#57725f] underline underline-offset-4" href={`/auth?next=${encodeURIComponent(next)}`}>
              返回登录
            </Link>
          </p>
        ) : isForgot ? (
          <p>
            想起来密码了？
            <Link className="font-medium text-[#57725f] underline underline-offset-4" href={`/auth?next=${encodeURIComponent(next)}`}>
              返回登录
            </Link>
          </p>
        ) : (
          <p>
            还没有账号？
            <Link className="font-medium text-[#57725f] underline underline-offset-4" href={`/auth?mode=signup&next=${encodeURIComponent(next)}`}>
              先注册一个
            </Link>
            <span className="mx-2 text-[#b8c3bb]">·</span>
            <Link className="font-medium text-[#57725f] underline underline-offset-4" href="/auth?mode=forgot">
              忘记密码
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
