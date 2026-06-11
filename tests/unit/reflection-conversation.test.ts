import { describe, expect, it } from "vitest";
import { getConversationEventText, prepareConversationEdit } from "@/lib/reflection/conversation";

describe("prepareConversationEdit", () => {
  it("returns the selected user message and removes it and all later replies", () => {
    const messages = [
      { role: "user" as const, content: "first question" },
      { role: "assistant" as const, content: "first answer" },
      { role: "user" as const, content: "second question" },
      { role: "assistant" as const, content: "second answer" },
    ];

    expect(prepareConversationEdit(messages, 2)).toEqual({
      input: "second question",
      messages: messages.slice(0, 2),
    });
  });

  it("does nothing when the selected message is not from the user", () => {
    const messages = [
      { role: "user" as const, content: "question" },
      { role: "assistant" as const, content: "answer" },
    ];

    expect(prepareConversationEdit(messages, 1)).toBeNull();
  });

  it("uses the first user message when the left event field is empty", () => {
    expect(
      getConversationEventText("", [
        { role: "user", content: "我今天突然觉得很累。" },
        { role: "assistant", content: "愿意说说发生了什么吗？" },
      ]),
    ).toBe("我今天突然觉得很累。");
  });
});
