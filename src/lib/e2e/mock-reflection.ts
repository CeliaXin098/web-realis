import type { ReflectionOutput } from "@/lib/ai/reflection-schema";

export function isE2EMode() {
  return process.env.E2E_MODE === "1" || process.env.NEXT_PUBLIC_E2E_MODE === "1";
}

export function getMockReflection(): ReflectionOutput {
  return {
    title: "会议里被跳过的方案",
    summary: "这次刺痛可能不只是方案被跳过，而是你的准备没有被认真看见。",
    gentle_response: "你已经为这件事投入了很多，被快速带过时感到委屈是可以理解的。",
    emotional_root: "真正被触发的是被看见、被尊重和被认真对待的需要。",
    underlying_needs: ["被看见", "被尊重", "清晰反馈"],
    pattern: "你可能会先沉默下来，再反复复盘自己是不是做得还不够好。",
    prescriptions: {
      film: ["心灵奇旅"],
      book: ["被讨厌的勇气"],
      music: ["一首低刺激纯音乐"],
      action: ["写下事实和感受各三句话"],
    },
    future_self_note: "愿未来的你记得：一次被跳过，不等于你的准备没有价值。",
    reasoning_notes: {
      emotional_root_basis: "依据用户提到准备很久的方案被快速跳过，以及对话中出现的委屈感。",
      pattern_basis: "依据用户把一次会议反馈延伸为自我怀疑的表达。",
      future_self_note_basis: "依据这次记录里最需要被重新确认的是准备本身的价值。",
      prescription_reasons: {
        film: ["用轻一点的故事感帮助情绪从会议场景里退出来。"],
        book: ["帮助用户练习把羞耻感和自我价值分开。"],
        music: ["低刺激音乐适合在委屈后慢慢降速。"],
        action: ["把事实和感受分开写，能减少反复内耗。"],
      },
    },
    compass_updates: [
      {
        relationship_type: "同事",
        nickname: "同事",
        closeness_score: 3,
        relation_mode_tags: [],
        common_triggers: ["贡献被忽略", "讨论节奏太快"],
        relationship_pattern_summary: "你在工作关系中很在意贡献是否被明确看见。",
        mbti_tendency: "可能呈现偏 Fi 的价值敏感与 Te 的结果压力，仅用于自我理解。",
        jungian_functions: [
          {
            code: "Fi",
            tendency: "对个人价值、尊重感和真实感较敏感",
            evidence: "用户反复提到认真准备没有被看见",
            score: 4,
          },
          {
            code: "Te",
            tendency: "希望贡献被清楚确认，并能推动事情有序前进",
            evidence: "事件发生在会议和方案讨论场景",
            score: 3,
          },
        ],
        interaction_guide: "用事实表达贡献和下一步请求，避免只在心里消化。",
      },
    ],
    safety_note: null,
  };
}
