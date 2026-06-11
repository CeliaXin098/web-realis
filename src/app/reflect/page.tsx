"use client";

import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  Loader2,
  MessageCircle,
  PencilLine,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReflectionResult } from "@/components/reflection-result";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { VoiceInputButton } from "@/components/voice-input-button";
import type { ReflectionOutput } from "@/lib/ai/reflection-schema";
import {
  buildReflectionCalendar,
  buildReflectionInsight,
  getRecentTimelineLabel,
  getRecentReflectionTimeline,
  type ReflectionSidebarRecord,
} from "@/lib/reflection/reflect-sidebar";
import { getConversationEventText, prepareConversationEdit } from "@/lib/reflection/conversation";
import { createEmptyReflectionSession } from "@/lib/reflection/session";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const emotionOptions = ["平静", "喜悦", "焦虑", "疲惫", "愤怒", "迷茫", "孤独", "委屈"];
const quickPeople = ["朋友", "同事", "伴侣", "妈妈", "爸爸", "儿子", "女儿", "其他"];
const REFLECT_DRAFT_STORAGE_KEY = "realis.reflect.draft.v1";

type ReflectDraft = {
  chatInput: string;
  emotionIntensity: number;
  emotionTags: string[];
  eventText: string;
  messages: ChatMessage[];
  reflection: ReflectionOutput | null;
  relatedPerson: string;
  started: boolean;
};

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
  const [records, setRecords] = useState<ReflectionSidebarRecord[]>([]);
  const [recordStatus, setRecordStatus] = useState<"loading" | "ready" | "guest">("loading");
  const draftLoadedRef = useRef(false);
  const chatAbortRef = useRef<AbortController | null>(null);

  const payload = useMemo(
    () => ({
      eventText: getConversationEventText(eventText, messages),
      emotionTags,
      emotionIntensity,
      relatedPerson,
      conversationMessages: messages,
    }),
    [emotionIntensity, emotionTags, eventText, messages, relatedPerson],
  );
  const today = new Date();
  const assistantMessages = messages.filter((message) => message.role === "assistant");
  const canStart = eventText.trim().length >= 10;

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(REFLECT_DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as Partial<ReflectDraft>;
        setEventText(typeof draft.eventText === "string" ? draft.eventText : "");
        setRelatedPerson(typeof draft.relatedPerson === "string" ? draft.relatedPerson : "");
        setEmotionIntensity(typeof draft.emotionIntensity === "number" ? draft.emotionIntensity : 5);
        setEmotionTags(Array.isArray(draft.emotionTags) ? draft.emotionTags.filter((item) => typeof item === "string") : []);
        setChatInput(typeof draft.chatInput === "string" ? draft.chatInput : "");
        setMessages(
          Array.isArray(draft.messages)
            ? draft.messages.filter((message): message is ChatMessage => {
                return (
                  (message?.role === "user" || message?.role === "assistant") &&
                  typeof message.content === "string" &&
                  message.content.length > 0
                );
              })
            : [],
        );
        setReflection((draft.reflection as ReflectionOutput | null | undefined) ?? null);
        setStarted(Boolean(draft.started || (Array.isArray(draft.messages) && draft.messages.length > 0)));
      }
    } catch {
      window.localStorage.removeItem(REFLECT_DRAFT_STORAGE_KEY);
    } finally {
      draftLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadRecords() {
      try {
        const response = await fetch("/api/records", { cache: "no-store" });
        if (ignore) return;

        if (response.status === 401) {
          setRecords([]);
          setRecordStatus("guest");
          return;
        }

        if (!response.ok) {
          setRecords([]);
          setRecordStatus("ready");
          return;
        }

        const data = (await response.json()) as ReflectionSidebarRecord[];
        setRecords(Array.isArray(data) ? data : []);
        setRecordStatus("ready");
      } catch {
        if (!ignore) {
          setRecords([]);
          setRecordStatus("ready");
        }
      }
    }

    loadRecords();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!draftLoadedRef.current) return;

    const hasDraft =
      eventText.trim() ||
      relatedPerson.trim() ||
      chatInput.trim() ||
      emotionTags.length > 0 ||
      messages.length > 0 ||
      reflection;

    if (!hasDraft || saved) {
      window.localStorage.removeItem(REFLECT_DRAFT_STORAGE_KEY);
      return;
    }

    const draft: ReflectDraft = {
      chatInput,
      emotionIntensity,
      emotionTags,
      eventText,
      messages,
      reflection,
      relatedPerson,
      started,
    };
    window.localStorage.setItem(REFLECT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [chatInput, emotionIntensity, emotionTags, eventText, messages, reflection, relatedPerson, saved, started]);

  async function startReflection() {
    if (!canStart) return;
    setStarted(true);
    await sendChatMessage(eventText.trim());
  }

  async function sendChatMessage(overrideText?: string) {
    const userText = chatInput.trim() || eventText.trim();
    const nextUserText = overrideText || userText;
    if (!nextUserText.trim()) return;

    setError("");
    setSaved(false);
    setReflection(null);
    setChatInput("");
    setChatLoading(true);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: nextUserText }];
    const requestEventText = getConversationEventText(eventText, nextMessages);
    setStarted(true);
    setMessages(nextMessages);

    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;

    try {
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, eventText: requestEventText, mode: "chat", conversationMessages: nextMessages }),
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "AI 暂时没有回应，请稍后再试。");
        return;
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
        setError("AI 暂时没有回应，请稍后再试。");
      }
    } finally {
      if (chatAbortRef.current === controller) {
        chatAbortRef.current = null;
        setChatLoading(false);
      }
    }
  }

  function cancelChatResponse() {
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    setChatLoading(false);
  }

  function editChatMessage(index: number) {
    const edit = prepareConversationEdit(messages, index);
    if (!edit) return;

    cancelChatResponse();
    setMessages(edit.messages);
    setChatInput(edit.input);
    setReflection(null);
    setSaved(false);
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
    const savedRecord = (await response.json()) as ReflectionSidebarRecord;
    if (savedRecord?.id) {
      setRecords((current) => [savedRecord, ...current.filter((record) => record.id !== savedRecord.id)]);
      setRecordStatus("ready");
    }
    window.localStorage.removeItem(REFLECT_DRAFT_STORAGE_KEY);
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

  function startNewReflection() {
    const empty = createEmptyReflectionSession();
    cancelChatResponse();
    setEventText(empty.eventText);
    setRelatedPerson(empty.relatedPerson);
    setEmotionIntensity(empty.emotionIntensity);
    setEmotionTags(empty.emotionTags);
    setChatInput(empty.chatInput);
    setMessages(empty.messages);
    setReflection(empty.reflection);
    setStarted(empty.started);
    setSaved(empty.saved);
    setError(empty.error);
    setFinalLoading(false);
    setSaving(false);
    window.localStorage.removeItem(REFLECT_DRAFT_STORAGE_KEY);
  }

  return (
    <main className="mx-auto w-full max-w-[1780px] px-4 py-6 sm:px-7 lg:py-8">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.38fr)]">
        {!started && !reflection ? (
        <section
          className="h-fit self-start rounded-[28px] border border-[#e0d8ca] bg-[#fbf8f1]/88 p-6 shadow-[0_26px_80px_rgba(74,63,48,0.08)] sm:p-8"
          data-testid="reflection-form-card"
        >
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
                placeholder=""
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

            <div className="grid gap-5 sm:grid-cols-[minmax(240px,420px)_160px]">
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
              aria-label="开始觉察"
              className="min-h-14 w-fit rounded-[18px] px-7 text-base"
              disabled={chatLoading || !canStart}
              onClick={startReflection}
              type="button"
            >
              {chatLoading && !started ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              开始与 AI 深度对话
            </Button>
            <p className="font-sans-soft text-xs text-muted">AI 会基于你的记录生成深度对话和觉察信</p>
          </div>
        </section>
        ) : (
        <ConversationPanel
          chatInput={chatInput}
          chatLoading={chatLoading}
          finalLoading={finalLoading}
          messages={messages}
          reflection={reflection}
          saved={saved}
          saving={saving}
          started={started}
          onCancel={cancelChatResponse}
          onBack={() => setStarted(false)}
          onEdit={editChatMessage}
          onGenerate={generateReflection}
          onInputChange={setChatInput}
          onNewRound={startNewReflection}
          onVoiceInput={(text) => setChatInput((current) => appendTranscript(current, text))}
          onSave={saveRecord}
          onSend={() => sendChatMessage()}
        />
        )}

        <InsightSidebar
          assistantCount={assistantMessages.length}
          assistantMessages={assistantMessages.map((message) => message.content)}
          emotionTags={emotionTags}
          eventText={eventText}
          records={records}
          recordStatus={recordStatus}
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
  onBack,
  onCancel,
  onEdit,
  onGenerate,
  onInputChange,
  onNewRound,
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
  onBack: () => void;
  onCancel: () => void;
  onEdit: (index: number) => void;
  onGenerate: () => void;
  onInputChange: (value: string) => void;
  onNewRound: () => void;
  onVoiceInput: (text: string) => void;
  onSave: () => void;
  onSend: () => void;
}) {
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const container = messageScrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [chatLoading, messages]);

  useEffect(() => {
    const input = chatInputRef.current;
    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${input.scrollHeight}px`;
  }, [chatInput]);

  return (
    <section
      className="box-border flex h-[calc(100vh-3rem)] min-h-[780px] max-h-[1120px] min-w-0 self-start flex-col overflow-hidden rounded-[28px] border border-[#e0d8ca] bg-[#fbf8f1]/82 shadow-[0_26px_80px_rgba(74,63,48,0.08)]"
      data-testid="conversation-card"
    >
      <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6 sm:px-7 sm:pt-7">
        <div>
          <h2 className="text-3xl font-semibold text-ink">
            {reflection ? "一封给你的觉察信" : "与 AI 的深度对话"}
          </h2>
          <p className="font-sans-soft mt-3 flex items-center gap-2 text-base text-muted">
            <span className="size-2 rounded-full bg-sage" />
            {reflection ? "已沉淀为结果" : started ? "正在对话中..." : "等待开始"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!reflection ? (
            <button
              className="font-sans-soft inline-flex items-center gap-2 rounded-full border border-[#ded6c8] bg-white/62 px-4 py-2 text-sm text-muted transition hover:bg-white hover:text-ink"
              onClick={onBack}
              type="button"
            >
              <ArrowLeft className="size-4" />
              返回补充信息
            </button>
          ) : null}
          <MessageCircle className="size-6 text-[#b98532]" />
        </div>
      </div>

      {reflection ? (
        <div className="mt-8 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 sm:px-7 sm:pb-7">
          <ReflectionResult onSave={onSave} reflection={reflection} saved={saved} saving={saving} />
          <Button className="mt-5 w-full" onClick={onNewRound} type="button" variant="secondary">
            <RotateCcw className="size-4" />
            开始新一轮觉察
          </Button>
        </div>
      ) : (
        <div className="mt-8 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 sm:px-7" ref={messageScrollRef}>
            {!started ? (
              <EmptyConversation />
            ) : (
              messages.map((message, index) => (
                <ChatBubble
                  index={index}
                  key={`${message.role}-${index}`}
                  message={message}
                  onEdit={onEdit}
                  time={`10:${30 + index}`}
                />
              ))
            )}
            {chatLoading ? (
              <div className="mr-auto flex items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#ded6c8] bg-white/76 px-4 py-2 text-sm text-muted">
                  <Loader2 className="size-4 animate-spin" />
                  AI 正在回应...
                </div>
                <button
                  className="font-sans-soft inline-flex items-center gap-1 rounded-full border border-[#ded6c8] bg-white/62 px-3 py-2 text-xs text-muted transition hover:bg-white hover:text-ink"
                  onClick={onCancel}
                  type="button"
                >
                  <X className="size-3.5" />
                  取消
                </button>
              </div>
            ) : null}
          </div>

          <div
            className="mx-4 mb-4 mt-4 max-h-[320px] shrink-0 overflow-y-auto rounded-[24px] border border-[#ded6c8] bg-white/76 shadow-[0_12px_34px_rgba(74,63,48,0.06)] sm:mx-7 sm:mb-5"
            data-testid="chat-composer"
          >
            <div className="px-4 pt-3">
              <Textarea
                aria-label="继续和 AI 说"
                className="min-h-[72px] resize-none overflow-hidden rounded-none border-0 bg-transparent px-1 py-2 text-base shadow-none focus:ring-0"
                onChange={(event) => onInputChange(event.target.value)}
                placeholder="继续分享你的想法..."
                ref={chatInputRef}
                rows={1}
                value={chatInput}
              />
            </div>
            <div className="sticky bottom-0 flex items-center justify-between gap-3 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.96)_28%)] px-4 pb-3 pt-5">
              <VoiceInputButton
                className="size-11 min-h-11 shrink-0 px-0"
                iconClassName="size-5"
                onTranscript={onVoiceInput}
                showText={false}
              />
              <Button
                aria-label="发送给 AI"
                className="size-11 min-h-11 rounded-full px-0"
                disabled={chatLoading || !chatInput.trim()}
                onClick={onSend}
                type="button"
              >
                {chatLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>

          {messages.some((message) => message.role === "assistant") ? (
            <Button
              className="mx-6 mb-5 mt-3 w-fit px-6 sm:mx-7"
              disabled={finalLoading}
              onClick={onGenerate}
              type="button"
              variant="secondary"
            >
              {finalLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {finalLoading ? "正在整理觉察信..." : "沉淀为结果"}
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
        <h3 className="mt-5 text-3xl font-semibold leading-tight text-ink">从此刻最想说的话开始</h3>
        <p className="font-sans-soft mt-4 text-sm leading-7 text-muted">
          你可以直接在下方开始对话，也可以先在左侧整理今天发生的事。
        </p>
      </div>
    </div>
  );
}

function ChatBubble({
  index,
  message,
  onEdit,
  time,
}: {
  index: number;
  message: ChatMessage;
  onEdit: (index: number) => void;
  time: string;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-end gap-3", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-[22px] px-5 py-4 text-base leading-8 shadow-[0_12px_34px_rgba(74,63,48,0.06)] sm:text-lg sm:leading-9",
          isUser
            ? "bg-[#e8dfd3] text-ink"
            : "border border-[#ded6c8] bg-white/76 text-ink",
        )}
      >
        {!isUser ? <Sparkles className="mb-2 size-4 text-[#b98532]" /> : null}
        <p>{message.content}</p>
        <div className="font-sans-soft mt-2 flex items-center justify-end gap-3 text-xs text-muted">
          {isUser ? (
            <button className="inline-flex items-center gap-1 transition hover:text-ink" onClick={() => onEdit(index)} type="button">
              <PencilLine className="size-3" />
              编辑
            </button>
          ) : null}
          <span>{time}</span>
        </div>
      </div>
      {isUser ? <div className="size-10 rounded-full bg-[linear-gradient(135deg,#dcc8b6,#f5eee2)] shadow-inner" /> : null}
    </div>
  );
}

function InsightSidebar({
  assistantCount,
  assistantMessages,
  emotionTags,
  eventText,
  records,
  recordStatus,
  relatedPerson,
  today,
}: {
  assistantCount: number;
  assistantMessages: string[];
  emotionTags: string[];
  eventText: string;
  records: ReflectionSidebarRecord[];
  recordStatus: "loading" | "ready" | "guest";
  relatedPerson: string;
  today: Date;
}) {
  const latestRecord = getRecentReflectionTimeline(records, 1)[0] ?? null;

  return (
    <aside className="space-y-4">
      <CalendarCard records={records} today={today} />
      <TodayCard
        assistantCount={assistantCount}
        assistantMessages={assistantMessages}
        emotionTags={emotionTags}
        eventText={eventText}
        latestRecord={latestRecord}
        relatedPerson={relatedPerson}
        today={today}
      />
      <TimelineCard records={records} recordStatus={recordStatus} />
    </aside>
  );
}

function CalendarCard({ records, today }: { records: ReflectionSidebarRecord[]; today: Date }) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const days = buildReflectionCalendar({
    month: visibleMonth.getMonth(),
    records,
    today,
    year: visibleMonth.getFullYear(),
  });

  function moveMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <section className="rounded-[26px] border border-[#e0d8ca] bg-[#fbf8f1]/82 p-6 shadow-[0_18px_55px_rgba(74,63,48,0.07)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-ink">觉察日历</h2>
        <div className="font-sans-soft flex items-center gap-3 text-base text-muted">
          <button aria-label="上个月" className="rounded-full p-1 transition hover:bg-white" onClick={() => moveMonth(-1)} type="button">
            <ChevronLeft className="size-4" />
          </button>
          <span>
            {visibleMonth.getFullYear()}年{visibleMonth.getMonth() + 1}月
          </span>
          <button aria-label="下个月" className="rounded-full p-1 transition hover:bg-white" onClick={() => moveMonth(1)} type="button">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="font-sans-soft mt-6 grid grid-cols-7 gap-3 text-center text-sm text-muted">
        {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-base">
        {days.map((day) => (
          <div
            className={cn(
              "relative grid aspect-square place-items-center rounded-full text-muted",
              !day.isCurrentMonth && "opacity-35",
              day.hasRecord && "bg-[#5e6756] text-paper shadow-[0_12px_30px_rgba(75,87,69,0.24)]",
              day.isToday && !day.hasRecord && "ring-2 ring-sage/40",
            )}
            key={day.dateKey}
          >
            {day.day}
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
  assistantMessages,
  emotionTags,
  eventText,
  latestRecord,
  relatedPerson,
  today,
}: {
  assistantCount: number;
  assistantMessages: string[];
  emotionTags: string[];
  eventText: string;
  latestRecord: ReflectionSidebarRecord | null;
  relatedPerson: string;
  today: Date;
}) {
  const insight = buildReflectionInsight({
    assistantMessages,
    emotionTags,
    eventText,
    latestRecord,
    relatedPerson,
  });

  return (
    <section className="rounded-[26px] border border-[#e0d8ca] bg-[#fbf8f1]/82 p-6 shadow-[0_18px_55px_rgba(74,63,48,0.07)]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-ink">
          今天 · {today.getMonth() + 1}月{today.getDate()}日
        </h2>
      </div>
      <dl className="font-sans-soft mt-6 space-y-4 text-base text-muted">
        <SummaryRow icon={Sparkles} label="主要情绪" value={emotionTags[0] || latestRecord?.emotion_tags[0] || "等待选择"} />
        <SummaryRow
          icon={CalendarDays}
          label="核心事件"
          value={assistantCount > 0 ? eventText.slice(0, 18) || latestRecord?.title || "正在整理" : "对话后生成"}
        />
        <SummaryRow icon={Home} label="相关人物" value={relatedPerson || latestRecord?.related_person || "未填写"} />
        <SummaryRow icon={Clock3} label="对话轮次" value={`${assistantCount} 轮`} />
      </dl>
      <div className="mt-6 rounded-[18px] bg-[#eee9df] p-4 text-base leading-8 text-muted">{insight}</div>
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

function TimelineCard({
  records,
  recordStatus,
}: {
  records: ReflectionSidebarRecord[];
  recordStatus: "loading" | "ready" | "guest";
}) {
  const items = getRecentReflectionTimeline(records);
  const emptyText =
    recordStatus === "guest" ? "登录后，这里会显示你的最近觉察记录。" : "还没有保存过觉察记录，完成一次觉察后这里会亮起来。";

  return (
    <section className="rounded-[26px] border border-[#e0d8ca] bg-[#fbf8f1]/82 p-6 shadow-[0_18px_55px_rgba(74,63,48,0.07)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink">觉察时间轴</h2>
          <p className="font-sans-soft mt-1 text-sm text-muted">
            {recordStatus === "loading" ? "正在读取记录" : getRecentTimelineLabel(items.length)}
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-5">
        {recordStatus === "loading" ? (
          <p className="font-sans-soft rounded-2xl border border-dashed border-[#ded6c8] bg-white/42 p-5 text-sm leading-7 text-muted">
            正在读取你的记录...
          </p>
        ) : items.length === 0 ? (
          <p className="font-sans-soft rounded-2xl border border-dashed border-[#ded6c8] bg-white/42 p-5 text-sm leading-7 text-muted">
            {emptyText}
          </p>
        ) : (
          items.map((item, index) => (
            <article className="grid grid-cols-[1.25rem_1fr] gap-4" key={item.id}>
              <div className="relative flex justify-center">
                <span
                  className={cn(
                    "mt-1 size-3 rounded-full ring-4 ring-[#fbf8f1]",
                    index % 3 === 0 && "bg-sage",
                    index % 3 === 1 && "bg-[#9a86b8]",
                    index % 3 === 2 && "bg-clay",
                  )}
                />
                {index < items.length - 1 ? <span className="absolute top-5 h-12 w-px bg-[#ded6c8]" /> : null}
              </div>
              <div>
                <p className="font-sans-soft text-base text-muted">{item.dateLabel}</p>
                <h3 className="mt-1 text-base font-semibold leading-7 text-ink">{item.title}</h3>
                <p className="font-sans-soft mt-1 text-sm text-muted">{item.metaLabel}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
