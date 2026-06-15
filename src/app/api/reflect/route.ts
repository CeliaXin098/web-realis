import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildReflectionChatPrompt, buildReflectionPrompt } from "@/lib/ai/prompt";
import { isCompletionTruncated } from "@/lib/ai/completion";
import { getOpenAIClientOptions } from "@/lib/ai/openai-config";
import { parseReflectionContent } from "@/lib/ai/reflection-parser";
import { getMockReflection, isE2EMode } from "@/lib/e2e/mock-reflection";
import { getUserMemoryContext } from "@/lib/memory/server";
import { createClient } from "@/lib/supabase/server";

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const inputSchema = z.object({
  mode: z.enum(["chat", "final"]).default("final"),
  eventText: z.string().min(1),
  emotionTags: z.array(z.string()).default([]),
  emotionIntensity: z.number().int().min(1).max(10),
  relatedPerson: z.string().optional(),
  conversationMessages: z.array(conversationMessageSchema).default([]),
});

function jsonError(message: string, status: number, detail?: string) {
  return NextResponse.json({ error: message, detail }, { status });
}

function mapAIError(error: unknown) {
  if (!(error instanceof Error)) {
    return jsonError("AI 服务暂时不可用，请稍后重试。", 502);
  }

  if (error.message === "AI_RESPONSE_INVALID_JSON" || error.message === "AI_RESPONSE_SCHEMA_MISMATCH") {
    return jsonError("AI 返回格式不完整，请稍后重试。", 502, error.message);
  }

  const maybeStatus = "status" in error && typeof error.status === "number" ? error.status : undefined;
  if (maybeStatus === 401) {
    return jsonError("AI 服务认证失败，请检查 API Key 和服务商配置。", 502, "AI_AUTH_FAILED");
  }
  if (maybeStatus === 404) {
    return jsonError("AI 模型不存在或当前账号不可用，请检查 OPENAI_MODEL。", 502, "AI_MODEL_NOT_FOUND");
  }
  if (maybeStatus === 429) {
    return jsonError("AI 服务请求过于频繁或额度不足，请稍后再试。", 502, "AI_RATE_LIMITED");
  }

  return jsonError("AI 服务暂时不可用，请稍后重试。", 502, error.message);
}

export async function POST(request: Request) {
  const parsedInput = inputSchema.safeParse(await request.json());
  if (!parsedInput.success) {
    return jsonError("请输入更具体的事件。", 400);
  }

  if (isE2EMode()) {
    if (parsedInput.data.mode === "chat") {
      return NextResponse.json({
        reply: "我听见你在这件事里很委屈，也很需要自己的准备被认真看见。你愿意再说说，最刺痛你的那一秒发生了什么吗？",
      });
    }

    return NextResponse.json(getMockReflection());
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("需要先登录后再调用 AI 觉察。", 401);
  }

  try {
    const openai = new OpenAI(getOpenAIClientOptions(process.env));
    const memoryContext = await getUserMemoryContext({
      input: {
        emotionTags: parsedInput.data.emotionTags,
        eventText: parsedInput.data.eventText,
        relatedPerson: parsedInput.data.relatedPerson,
      },
      supabase: supabase as any,
      userId: user.id,
    });

    if (parsedInput.data.mode === "chat") {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "你是 Realis / 返照的 AI 觉察陪伴者。请用自然语言回应，不要输出 JSON，不做医学诊断。",
          },
          {
            role: "user",
            content: buildReflectionChatPrompt({ ...parsedInput.data, memoryContext }),
          },
        ],
        temperature: 0.55,
        max_tokens: 1400,
      });

      if (isCompletionTruncated(completion.choices[0]?.finish_reason)) {
        return jsonError("AI 回答超过了长度限制，请重新发送一次。", 502, "AI_RESPONSE_TRUNCATED");
      }

      const reply = completion.choices[0]?.message.content;
      if (!reply) {
        return jsonError("AI 暂时没有返回内容，请稍后重试。", 502, "AI_RESPONSE_EMPTY");
      }

      return NextResponse.json({ reply });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "你只返回可以被 JSON.parse 解析的 JSON 对象，不要输出 Markdown。",
        },
        {
          role: "user",
          content: buildReflectionPrompt({ ...parsedInput.data, memoryContext }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 3800,
    });

    if (isCompletionTruncated(completion.choices[0]?.finish_reason)) {
      return jsonError("觉察信超过了长度限制，请重新生成一次。", 502, "AI_RESPONSE_TRUNCATED");
    }

    const content = completion.choices[0]?.message.content;
    if (!content) {
      return jsonError("AI 暂时没有返回内容，请稍后重试。", 502, "AI_RESPONSE_EMPTY");
    }

    return NextResponse.json(parseReflectionContent(content));
  } catch (error) {
    return mapAIError(error);
  }
}
