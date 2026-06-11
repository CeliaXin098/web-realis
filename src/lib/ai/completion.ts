export function isCompletionTruncated(finishReason: string | null | undefined) {
  return finishReason === "length";
}
