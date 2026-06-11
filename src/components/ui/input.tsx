import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-line bg-white/72 px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-4 focus:ring-sage/10",
        className,
      )}
      {...props}
    />
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        className={cn(
          "w-full resize-y rounded-3xl border border-line bg-white/72 px-5 py-4 text-sm leading-7 text-ink outline-none transition placeholder:text-muted/55 focus:border-sage focus:ring-4 focus:ring-sage/10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
