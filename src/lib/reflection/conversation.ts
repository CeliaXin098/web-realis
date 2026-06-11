export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export function prepareConversationEdit(messages: ConversationMessage[], index: number) {
  const selected = messages[index];
  if (!selected || selected.role !== "user") return null;

  return {
    input: selected.content,
    messages: messages.slice(0, index),
  };
}

export function getConversationEventText(eventText: string, messages: ConversationMessage[]) {
  return eventText.trim() || messages.find((message) => message.role === "user")?.content.trim() || "";
}
