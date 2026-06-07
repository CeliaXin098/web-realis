import Link from "next/link";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string; type?: string }>;
}) {
  const params = await searchParams;
  const email = params.email || "你的邮箱";
  const next = params.next || "/reflect";
  const isRecovery = params.type === "recovery";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <div className="rounded-2xl border border-[#d9e1dc] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-[#7b927f]">{isRecovery ? "密码重置邮件已发送" : "请先验证邮箱"}</p>
        <h1 className="mt-3 text-4xl font-semibold text-ink">{isRecovery ? "去邮箱重设密码" : "去邮箱完成注册"}</h1>
        <p className="mt-5 leading-8 text-muted">
          {isRecovery
            ? `我们已经向 ${email} 发送了密码重置邮件。点击邮件里的链接后，就可以设置新密码。`
            : `我们已经向 ${email} 发送了验证邮件。点击邮件里的链接后，你就可以继续进入 Realis。`}
        </p>
        <p className="mt-4 leading-8 text-muted">
          如果几分钟后还没收到，请检查垃圾邮箱；正式上线前，也建议在 Supabase 中配置自己的 SMTP。
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-full bg-[#7b927f] px-5 py-3 text-sm font-medium text-white" href={`/auth?next=${encodeURIComponent(next)}`}>
            返回登录
          </Link>
          <Link className="rounded-full border border-[#d9e1dc] px-5 py-3 text-sm font-medium text-muted" href={isRecovery ? "/auth?mode=forgot" : `/auth?mode=signup&next=${encodeURIComponent(next)}`}>
            {isRecovery ? "重新发送" : "返回注册"}
          </Link>
        </div>
      </div>
    </main>
  );
}
