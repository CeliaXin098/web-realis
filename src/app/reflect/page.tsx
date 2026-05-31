"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ReflectionResult } from "@/components/reflection-result";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { VoiceInputButton } from "@/components/voice-input-button";
import type { ReflectionOutput } from "@/lib/ai/reflection-schema";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const emotionOptions = ["平静", "喜悦", "焦虑", "疲惫", "愤怒", "迷茫", "孤独", "委屈"];
const quickPeople = ["他（同事）", "朋友", "妈妈"];
const insightTags = ["被理解", "轻松自在", "彼此支持", "共同成长", "其他"];

export default function ReflectPage() {
  const [eventText, setEventText] = useState("");
  const [relatedPerson, setRelatedPerson] = useState("");
  const [emotionIntensity, setEmotionIntensity] = useState(5);
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reflection, setReflection] = useState<ReflectionOutput | null>(null);
  const [started, setStarted] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [finalLoading, setFinalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const payload = useMemo(
    () => ({ eventText, emotionTags, emotionIntensity, relatedPerson, conversationMessages: messages }),
    [emotionIntensity, emotionTags, eventText, messages, relatedPerson],
  );
  const today = new Date();
  const assistantMessages = messages.filter((message) => message.role === "assistant");
  const canStart = eventText.trim().length >= 10;

  async function startReflection() {
    if (!canStart) return;
    setStarted(true);
    await sendChatMessage(eventText.trim());
  }

  async function sendChatMessage(overrideText?: string) {
    const userText = chatInput.trim() || eventText.trim();
    const nextUserText = overrideText || userText;
    if (nextUserText.length < 10) return;

    setError("");
    setSaved(false);
    setReflection(null);
    setChatInput("");
    setChatLoading(true);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: nextUserText }];
    setMessages(nextMessages);

    const response = await fetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, mode: "chat", conversationMessages: nextMessages }),
    });

    const data = await response.json();
    setChatLoading(false);

    if (!response.ok) {
      setError(data.error || "AI 暂时没有回应，请稍后再试。");
      return;
    }

    setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
  }

  async function generateReflection() {
    setError("");
    setSaved(false);
    setFinalLoading(true);

    const response = await fetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, mode: "final" }),
    });

    const data = await response.json();
    setFinalLoading(false);

    if (!response.ok) {
      setError(data.error || "生成失败，请稍后再试。");
      return;
    }

    setReflection(data);
  }

  async function saveRecord() {
    if (!reflection) return;
    setSaving(true);
    setError("");

    const response = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, reflection }),
    });

    setSaving(false);
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "保存失败，请稍后再试。");
      return;
    }
    setSaved(true);
  }

  function toggleEmotion(emotion: string) {
    setEmotionTags((current) =>
      current.includes(emotion) ? current.filter((item) => item !== emotion) : [...current, emotion],
    );
  }

  function appendEventTranscript(text: string) {
    setEventText((current) => appendTranscript(current, text));
  }

  return (
    <main className="mx-auto w-full max-w-[1780px] px-4 py-6 sm:px-7 lg:py-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(440px,0.92fr)_minmax(620px,1.18fr)_minmax(400px,0.9fr)]">
        <section className="rounded-[28px] border border-[#e0d8ca] bg-[#fbf8f1]/88 p-6 shadow-[0_26px_80px_rgba(74,63,48,0.08)] sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h1 className="text-5xl font-semibold leading-tight text-ink">AI 觉察</h1>
              <p className="font-sans-soft mt-3 text-base text-muted">深度自我对话，与 AI 一起看见真实的自己</p>
            </div>
            <DriedFlower />
          </div>

          <div className="mt-12">
            <h2 className="max-w-sm text-3xl font-semibold leading-snug text-ink">
              先和自己慢慢聊聊，
              <br />
              再生成一封觉察信。
            </h2>
            <p className="font-sans-soft mt-5 max-w-lg text-base leading-8 text-muted">
              记录今天发生的事，选择情绪与相关人物。AI 会陪你看见更深层的自己与关系模式。
            </p>
          </div>

          <div className="mt-9 space-y-7">
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="font-sans-soft text-base font-semibold text-ink" htmlFor="event">
                  今天发生了什么？
                </label>
                <VoiceInputButton onTranscript={appendEventTranscript} />
              </div>
              <Textarea
                aria-label="具体事件"
                className="mt-3 min-h-56 rounded-[22px] bg-white/76 text-base"
                id="event"
                maxLength={500}
                onChange={(event) => setEventText(event.target.value)}
                placeholder="他既是同事也是好朋友对象，我们出去吃了一次饭，感觉还行，但我现在很犹豫要不要继续接触发展，我怕怕万一放不了，事情的走向会变得尴尬。"
                value={eventText}
              />
              <p className="font-sans-soft mt-2 text-right text-xs text-muted">{eventText.length}/500</p>
            </div>

            <div>
              <p className="font-sans-soft text-base font-semibold text-ink">此刻的情绪是？</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {emotionOptions.map((emotion) => (
                  <button
                    className={cn(
                      "rounded-full border px-5 py-2.5 text-base transition",
                      emotionTags.includes(emotion)
                        ? "border-night bg-night text-paper shadow-sm"
                        : "border-[#ded6c8] bg-white/62 text-muted hover:bg-white hover:text-ink",
                    )}
                    key={emotion}
                    onClick={() => toggleEmotion(emotion)}
                    type="button"
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
              <div>
                <label className="font-sans-soft text-base font-semibold text-ink" htmlFor="person">
                  相关人物
                </label>
                <Input
                  aria-label="相关人物"
                  className="mt-3 rounded-[18px] bg-white/76 text-base"
                  id="person"
                  onChange={(event) => setRelatedPerson(event.target.value)}
                  placeholder="自己 / 父亲 / 同事 / 伴侣..."
                  value={relatedPerson}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickPeople.map((person) => (
                    <button
                      className="font-sans-soft rounded-full border border-[#ded6c8] bg-white/58 px-3.5 py-2 text-sm text-muted transition hover:bg-white hover:text-ink"
                      key={person}
                      onClick={() => setRelatedPerson(person)}
                      type="button"
                    >
                      {person}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-sans-soft text-base font-semibold text-ink" htmlFor="intensity">
                  情绪强度
                </label>
                <div className="mt-3 rounded-[22px] border border-[#ded6c8] bg-white/62 p-4">
                  <p className="text-3xl font-semibold text-ink">{emotionIntensity}</p>
                  <input
                    className="mt-5 w-full accent-[#6f7b62]"
                    id="intensity"
                    max={10}
                    min={1}
                    onChange={(event) => setEmotionIntensity(Number(event.target.value))}
                    type="range"
                    value={emotionIntensity}
                  />
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-clay/30 bg-clay/10 p-4 text-sm leading-6 text-[#8a4b39]">
                {error}
              </div>
            ) : null}

            <p className="font-sans-soft flex gap-2 rounded-2xl bg-white/56 p-4 text-sm leading-6 text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage" />
              AI 觉察不是医学诊断，也不能替代心理治疗。如果你处于急性危机中，请优先联系可信任的人或当地紧急服务。
            </p>

            <Button
              className="min-h-14 w-full rounded-[18px] text-base"
              disabled={chatLoading || !canStart}
              onClick={startReflection}
              type="button"
            >
              {chatLoading && !started ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              开始与 AI 深度对话
            </Button>
            <p className="font-sans-soft text-center text-xs text-muted">AI 会基于你的记录生成深度对话和觉察信</p>
          </div>
        </section>

        <ConversationPanel
          chatInput={chatInput}
          chatLoading={chatLoading}
          finalLoading={finalLoading}
          messages={messages}
          reflection={reflection}
          saved={saved}
          saving={saving}
          started={started}
          onGenerate={generateReflection}
          onInputChange={setChatInput}
          onVoiceInput={(text) => setChatInput((current) => appendTranscript(current, text))}
          onSave={saveRecord}
          onSend={() => sendChatMessage()}
        />

        <InsightSidebar
          assistantCount={assistantMessages.length}
          emotionTags={emotionTags}
          eventText={eventText}
          relatedPerson={relatedPerson}
          today={today}
        />
      </div>
    </main>
  );
}

function appendTranscript(current: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return current;
  return current.trim() ? `${current.trim()} ${trimmed}` : trimmed;
}

function DriedFlower() {
  return (
    <div className="relative hidden h-40 w-28 shrink-0 sm:block">
      <span className="absolute bottom-4 left-12 h-28 w-px rotate-[-10deg] bg-[#b7a083]" />
      <span className="absolute bottom-8 left-12 h-24 w-px rotate-[18deg] bg-[#b7a083]" />
      {[14, 24, 36, 48, 60].map((top, index) => (
        <span
          className="absolute size-3 rounded-full border border-[#d8c7b0] bg-[#f4eadb]"
          key={top}
          style={{ left: `${40 + (index % 2) * 22}px`, top }}
        />
      ))}
      <span className="absolute bottom-0 left-8 h-8 w-16 rotate-[-3deg] rounded-sm bg-[#d7c1a3]/70" />
    </div>
  );
}

function ConversationPanel({
  chatInput,
  chatLoading,
  finalLoading,
  messages,
  reflection,
  saved,
  saving,
  started,
  onGenerate,
  onInputChange,
  onVoiceInput,
  onSave,
  onSend,
}: {
  chatInput: string;
  chatLoading: boolean;
  finalLoading: boolean;
  messages: ChatMessage[];
  reflection: ReflectionOutput | null;
  saved: boolean;
  saving: boolean;
  started: boolean;
  onGenerate: () => void;
  onInputChange: (value: string) => void;
  onVoiceInput: (text: string) => void;
  onSave: () => void;
  onSend: () => void;
}) {
  return (
    <section className="min-h-[720px] rounded-[28px] border border-[#e0d8ca] bg-[#fbf8f1]/82 p-6 shadow-[0_26px_80px_rgba(74,63,48,0.08)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-ink">
            {reflection ? "一封给你的觉察信" : "与 AI 的深度对话"}
          </h2>
          <p className="font-sans-soft mt-3 flex items-center gap-2 text-base text-muted">
            <span className="size-2 rounded-full bg-sage" />
            {reflection ? "已沉淀为结果" : started ? "正在对话中..." : "等待开始"}
          </p>
        </div>
        <MessageCircle className="size-6 text-[#b98532]" />
      </div>

      {reflection ? (
        <div className="mt-8 max-h-[780px] overflow-y-auto pr-1">
          <ReflectionResult onSave={onSave} reflection={reflection} saved={saved} saving={saving} />
        </div>
      ) : (
        <div className="mt-8 flex h-[calc(100%-78px)] min-h-[620px] flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
            {!started ? (
              <EmptyConversation />
            ) : (
              messages.map((message, index) => (
                <ChatBubble key={`${message.role}-${index}`} message={message} time={`10:${30 + index}`} />
              ))
            )}
            {chatLoading ? (
              <div className="mr-auto inline-flex items-center gap-2 rounded-full border border-[#ded6c8] bg-white/76 px-4 py-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" />
                AI 正在回应...
              </div>
            ) : null}
          </div>

          {messages.some((message) => message.role === "assistant") ? (
            <div className="mb-4 mt-5 flex flex-wrap gap-2">
              {insightTags.map((tag) => (
                <span className="font-sans-soft rounded-full border border-[#ded6c8] bg-white/62 px-4 py-2 text-xs text-muted" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 rounded-[24px] border border-[#ded6c8] bg-white/76 p-3 sm:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3">
              <Input
                aria-label="继续和 AI 说"
                className="border-0 bg-transparent px-2 text-base shadow-none focus:ring-0"
                onChange={(event) => onInputChange(event.target.value)}
                placeholder="继续分享你的想法..."
                value={chatInput}
              />
              <Paperclip className="hidden size-5 text-muted sm:block" />
              <VoiceInputButton className="min-h-10 w-10 px-0" showText={false} onTranscript={onVoiceInput} />
            </div>
            <Button disabled={chatLoading} onClick={onSend} type="button">
              {chatLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              发送
            </Button>
          </div>

          {messages.some((message) => message.role === "assistant") ? (
            <Button
              className="mt-3 w-full"
              disabled={finalLoading}
              onClick={onGenerate}
              type="button"
              variant="secondary"
            >
              {finalLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              沉淀为结果
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}

function EmptyConversation() {
  return (
    <div className="grid h-full place-items-center rounded-[24px] border border-dashed border-[#ded6c8] bg-white/38 p-8 text-center">
      <div className="max-w-sm">
        <Sparkles className="mx-auto size-7 text-[#b98532]" />
        <h3 className="mt-5 text-3xl font-semibold leading-tight text-ink">先在左侧写下今天的片刻</h3>
        <p className="font-sans-soft mt-4 text-sm leading-7 text-muted">
          点击“开始与 AI 深度对话”后，这里会接住你的第一段记录，并陪你继续往深处看。
        </p>
      </div>
    </div>
  );
}

function ChatBubble({ message, time }: { message: ChatMessage; time: string }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-end gap-3", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-[22px] px-5 py-4 text-sm leading-7 shadow-[0_12px_34px_rgba(74,63,48,0.06)]",
          isUser
            ? "bg-[#e8dfd3] text-ink"
            : "border border-[#ded6c8] bg-white/76 text-ink",
        )}
      >
        {!isUser ? <Sparkles className="mb-2 size-4 text-[#b98532]" /> : null}
        <p>{message.content}</p>
        <p className="font-sans-soft mt-2 text-right text-xs text-muted">{time}</p>
      </div>
      {isUser ? <div className="size-10 rounded-full bg-[linear-gradient(135deg,#dcc8b6,#f5eee2)] shadow-inner" /> : null}
    </div>
  );
}

function InsightSidebar({
  assistantCount,
  emotionTags,
  eventText,
  relatedPerson,
  today,
}: {
  assistantCount: number;
  emotionTags: string[];
  eventText: string;
  relatedPerson: string;
  today: Date;
}) {
  return (
    <aside className="space-y-4">
      <CalendarCard today={today} />
      <TodayCard
        assistantCount={assistantCount}
        emotionTags={emotionTags}
        eventText={eventText}
        relatedPerson={relatedPerson}
        today={today}
      />
      <TimelineCard />
    </aside>
  );
}

function CalendarCard({ today }: { today: Date }) {
  const days = [
    ["28", "muted"],
    ["29", "muted"],
    ["30", "muted"],
    ["1", "record"],
    ["2", "record"],
    ["3", "record"],
    ["4", "record"],
    ["5", "record"],
    ["6", "record"],
    ["7", "record"],
    ["8", "record"],
    ["9", "record"],
    ["10", "record"],
    ["11", "record"],
    ["12", "record"],
    ["13", "record"],
    ["14", "record"],
    ["15", "record"],
    ["16", "record"],
    ["17", "record"],
    ["18", "record"],
    ["19", "record"],
    ["20", "active"],
    ["21", "record"],
    ["22", "record"],
    ["23", "record"],
    ["24", "record"],
    ["25", "muted"],
    ["26", "record"],
    ["27", "record"],
    ["28", "record"],
    ["29", "record"],
    ["30", "record"],
    ["31", "record"],
    ["1", "muted"],
  ];

  return (
    <section className="rounded-[26px] border border-[#e0d8ca] bg-[#fbf8f1]/82 p-6 shadow-[0_18px_55px_rgba(74,63,48,0.07)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-ink">觉察日历</h2>
        <div className="font-sans-soft flex items-center gap-3 text-base text-muted">
          {today.getFullYear()}年{today.getMonth() + 1}月
          <ChevronLeft className="size-4" />
          <ChevronRight className="size-4" />
        </div>
      </div>
      <div className="font-sans-soft mt-6 grid grid-cols-7 gap-3 text-center text-sm text-muted">
        {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-base">
        {days.map(([day, tone], index) => (
          <div
            className={cn(
              "relative grid aspect-square place-items-center rounded-full text-muted",
              (tone === "active" || tone === "record") && "bg-[#5e6756] text-paper shadow-[0_12px_30px_rgba(75,87,69,0.24)]",
            )}
            key={`${day}-${index}`}
          >
            {day}
            {tone !== "muted" && tone !== "active" && tone !== "record" ? (
              <span
                className={cn(
                  "absolute bottom-1.5 size-1 rounded-full",
                  "bg-sage",
                )}
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="font-sans-soft mt-5 flex flex-wrap gap-4 text-sm text-muted">
        <LegendDot color="bg-sage" label="有记录" />
        <LegendDot color="bg-[#ded6c8]" label="无记录" />
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function TodayCard({
  assistantCount,
  emotionTags,
  eventText,
  relatedPerson,
  today,
}: {
  assistantCount: number;
  emotionTags: string[];
  eventText: string;
  relatedPerson: string;
  today: Date;
}) {
  return (
    <section className="rounded-[26px] border border-[#e0d8ca] bg-[#fbf8f1]/82 p-6 shadow-[0_18px_55px_rgba(74,63,48,0.07)]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-ink">今天 · {today.getMonth() + 1}月{today.getDate()}日</h2>
        <button className="font-sans-soft text-sm text-muted" type="button">编辑</button>
      </div>
      <dl className="font-sans-soft mt-6 space-y-4 text-base text-muted">
        <SummaryRow icon={Sparkles} label="主要情绪" value={emotionTags[0] || "等待选择"} />
        <SummaryRow icon={CalendarDays} label="核心事件" value={eventText ? eventText.slice(0, 18) : "还没有记录"} />
        <SummaryRow icon={Home} label="相关人物" value={relatedPerson || "未填写"} />
        <SummaryRow icon={Clock3} label="对话轮次" value={`${assistantCount} 轮`} />
      </dl>
      <div className="mt-6 rounded-[18px] bg-[#eee9df] p-4 text-base leading-8 text-muted">
        AI洞察：你在关系中重视安心和看重，这反映了你对深层连接的渴望。
      </div>
    </section>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 text-sage" />
      <dt className="w-20 shrink-0 text-muted">{label}</dt>
      <dd className="truncate text-ink">{value}</dd>
    </div>
  );
}

function TimelineCard() {
  const items = [
    ["5月20日", "与同事吃饭后的纠结", "深度对话 · 23 分钟", "sage"],
    ["5月18日", "和妈妈的沟通让我很内疚", "情绪记录 · 焦虑", "sage"],
    ["5月15日", "对未来感到迷茫", "深度对话 · 18 分钟", "purple"],
    ["5月12日", "和闺蜜聊天后心情好多了", "情绪记录 · 喜悦", "clay"],
  ];

  return (
    <section className="rounded-[26px] border border-[#e0d8ca] bg-[#fbf8f1]/82 p-6 shadow-[0_18px_55px_rgba(74,63,48,0.07)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-ink">觉察时间轴</h2>
        <button className="font-sans-soft inline-flex items-center gap-1 text-sm text-muted" type="button">
          查看全部
          <ChevronRight className="size-3" />
        </button>
      </div>
      <div className="mt-6 space-y-5">
        {items.map(([date, title, meta, tone]) => (
          <article className="grid grid-cols-[1.25rem_1fr] gap-4" key={title}>
            <div className="relative flex justify-center">
              <span
                className={cn(
                  "mt-1 size-3 rounded-full ring-4 ring-[#fbf8f1]",
                  tone === "sage" && "bg-sage",
                  tone === "purple" && "bg-[#9a86b8]",
                  tone === "clay" && "bg-clay",
                )}
              />
              <span className="absolute top-5 h-12 w-px bg-[#ded6c8]" />
            </div>
            <div>
              <p className="font-sans-soft text-base text-muted">{date}</p>
              <h3 className="mt-1 text-base font-semibold leading-7 text-ink">{title}</h3>
              <p className="font-sans-soft mt-1 text-sm text-muted">{meta}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
