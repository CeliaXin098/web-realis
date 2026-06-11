export function createEmptyReflectionSession() {
  return {
    chatInput: "",
    emotionIntensity: 5,
    emotionTags: [] as string[],
    error: "",
    eventText: "",
    messages: [] as Array<{ role: "user" | "assistant"; content: string }>,
    reflection: null,
    relatedPerson: "",
    saved: false,
    started: false,
  };
}
