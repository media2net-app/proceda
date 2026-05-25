"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getRecruitmentChatAnswer,
  getRecruitmentChatPrompts,
  type RecruitmentChatContext,
} from "@/lib/demo-app/recruitment-ai-chat";
import { useTypewriter } from "./useTypewriter";
import { RecruitmentAiBadge } from "./RecruitmentAiBlocks";

type ChatMessage = { role: "user" | "assistant"; text: string };

export function RecruitmentAiChatPanel({
  context,
  primaryColor,
  className = "",
}: {
  context: RecruitmentChatContext;
  primaryColor: string;
  className?: string;
}) {
  const prompts = getRecruitmentChatPrompts(context);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState("");

  const { displayed, done } = useTypewriter(pendingAnswer ?? "", {
    enabled: !!pendingAnswer && !thinking,
    speedMs: 12,
  });

  useEffect(() => {
    if (pendingAnswer && done) {
      setMessages((prev) => [...prev, { role: "assistant", text: pendingAnswer }]);
      setPendingAnswer(null);
    }
  }, [pendingAnswer, done]);

  const busy = thinking || !!pendingAnswer;

  const ask = useCallback(
    (promptId: string, label: string) => {
      const answer = getRecruitmentChatAnswer(context, promptId);
      if (!answer) return;

      setMessages((prev) => [...prev, { role: "user", text: label }]);
      setThinking(true);
      setPendingAnswer(null);

      window.setTimeout(() => {
        setThinking(false);
        setPendingAnswer(answer);
      }, 700);
    },
    [context],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim().toLowerCase();
    if (!q) return;
    const raw = input.trim();
    setInput("");

    const matched = prompts.find((p) => {
      const label = p.label.toLowerCase();
      return (
        q.includes(label.slice(0, 12)) ||
        (p.id === "score" &&
          (q.includes("94") || q.includes("score") || q.includes("waarom"))) ||
        (p.id === "risks" && (q.includes("risico") || q.includes("aandacht"))) ||
        (p.id === "intake" && q.includes("intake"))
      );
    });

    if (matched) {
      ask(matched.id, matched.label);
      return;
    }

    const fallback = prompts[0];
    if (fallback) ask(fallback.id, raw);
  }

  return (
    <section
      className={`flex flex-col rounded-xl border border-[#475467] bg-[#1D2939] shadow-sm ${className}`}
    >
      <div className="border-b border-[#475467] px-4 py-3">
        <div className="flex items-center gap-2">
          <RecruitmentAiBadge primaryColor={primaryColor} label="AI-assistent" />
          <span className="text-sm font-semibold text-[#F9FAFB]">Vraag de AI</span>
        </div>
        <p className="mt-1 text-xs text-[#98A2B3]">
          Klik een suggestie of typ een vraag — antwoord verschijnt live
        </p>
      </div>

      <div className="flex max-h-[300px] min-h-[180px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !busy && (
          <p className="text-sm text-[#98A2B3]">
            Bijv. &quot;Waarom 94%?&quot; of &quot;Wat zijn de risico&apos;s?&quot;
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[95%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "ml-auto bg-[#7F56D9] text-white"
                : "bg-[#344054] text-[#E4E7EC]"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {thinking && (
          <div className="max-w-[95%] rounded-lg bg-[#344054] px-3 py-2">
            <span className="inline-flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#98A2B3]" />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-[#98A2B3]"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-[#98A2B3]"
                style={{ animationDelay: "0.3s" }}
              />
            </span>
          </div>
        )}
        {pendingAnswer && !thinking && (
          <div className="max-w-[95%] rounded-lg bg-[#344054] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-[#E4E7EC]">
            {displayed}
            {!done && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#E9D7FE]" />
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#475467] px-3 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {prompts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => ask(p.id, p.label)}
              disabled={busy}
              className="rounded-full border border-[#475467] bg-[#344054] px-2.5 py-1 text-[11px] font-semibold text-[#E4E7EC] hover:bg-[#475467] disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stel een vraag…"
            disabled={busy}
            className="min-w-0 flex-1 rounded-lg border border-[#475467] bg-[#344054] px-3 py-2 text-sm text-[#F9FAFB] placeholder:text-[#667085] focus:border-[#9E77ED] focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            →
          </button>
        </form>
      </div>
    </section>
  );
}
