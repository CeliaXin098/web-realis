import Link from "next/link";
import { updatePassword } from "../actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#7b927f]">安全设置</p>
        <h1 className="mt-2 text-4xl font-semibold">设置新密码</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">输入一个新的登录密码。完成后，你需要用新密码重新登录。</p>
      </div>

      {params.error ? (
        <p className="mb-5 rounded-lg border border-[#e7c7bd] bg-[#fff7f3] p-3 text-sm text-[#8a4b39]">{params.error}</p>
      ) : null}

      <form action={updatePassword} className="rounded-lg border border-[#d9e1dc] bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-muted" htmlFor="password">
          新密码
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-md border border-[#d9e1dc] px-3 py-3 outline-none focus:border-[#7b927f]"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />

        <label className="mt-4 block text-sm font-medium text-muted" htmlFor="confirmPassword">
          再输一次新密码
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

        <button className="mt-6 w-full rounded-md bg-[#7b927f] px-4 py-3 font-medium text-white" type="submit">
          更新密码
        </button>
      </form>

      <div className="mt-5 rounded-lg border border-[#d9e1dc] bg-[#f7faf8] p-4 text-sm leading-6 text-muted">
        <p>
          如果这个链接已经失效，
          <Link className="font-medium text-[#57725f] underline underline-offset-4" href="/auth?mode=forgot">
            重新申请密码重置
          </Link>
        </p>
      </div>
    </main>
  );
}
