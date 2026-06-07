export type Locale = "zh" | "en";

const messages = {
  zh: {
    "nav.reflect": "AI觉察",
    "home.title": "给今天的心事，留一间安静发光的房间。",
    "home.body": "从一件具体的小事写起，让情绪慢慢显影，也让你重新看见自己。",
    "home.start": "开始觉察",
    "home.auth": "登录 / 注册",
    "home.langTarget": "EN",
    "home.langHref": "/?lang=en",
  },
  en: {
    "nav.reflect": "AI Reflection",
    "home.title": "Write down what happened today and see the need beneath the emotion.",
    "home.body":
      "Realis turns concrete moments into gentle, structured AI reflection letters you can revisit in your private memory gallery and relationship compass.",
    "home.start": "Start Reflection",
    "home.auth": "Log in / Sign up",
    "home.langTarget": "中文",
    "home.langHref": "/",
  },
} satisfies Record<Locale, Record<string, string>>;

export function getLocaleFromSearchParam(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "zh";
}

export function t(locale: Locale, key: keyof (typeof messages)["zh"]) {
  return messages[locale][key] ?? messages.zh[key];
}
