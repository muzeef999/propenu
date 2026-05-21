"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { IoClose, IoSend } from "react-icons/io5";

import { getChatbotResponse } from "@/data/ClientData";
import { ChatbotIcon } from "@/icons/icons";

const quickPrompts = ["2 BHK", "Plots", "Near metro"];

type HomeMateChatbotProps = {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Hi, I can help you find verified homes, plots, and commercial spaces. What are you looking for today?",
  },
];

const getResponseText = (data: any) => {
  if (!data) return "I could not find a response. Please try again.";

  if (typeof data === "string") {
    const messages = data
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter((event) => event.type === "message" || event.type === "error")
      .map((event) => event.content || event.message)
      .filter(Boolean);

    return messages.at(-1) || data;
  }

  return (
    data.content ||
    data.message ||
    data.response ||
    data.answer ||
    data.data?.content ||
    data.data?.message ||
    "I could not find a response. Please try again."
  );
};

const HomeMateChatbot = ({
  isOpen = true,
  onOpen,
  onClose,
}: HomeMateChatbotProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const chatbotMutation = useMutation({
    mutationFn: getChatbotResponse,
    onSuccess: (data) => {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: getResponseText(data),
        },
      ]);
    },
    onError: () => {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "Sorry, I could not connect right now. Please try again.",
        },
      ]);
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setIsPanelVisible(false);
      setIsClosing(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      setIsPanelVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setIsPanelVisible(false);

    window.setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 220);
  };

  const sendMessage = (nextMessage: string) => {
    const trimmedMessage = nextMessage.trim();
    if (!trimmedMessage || chatbotMutation.isPending) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmedMessage,
      },
    ]);
    setMessage("");
    chatbotMutation.mutate(trimmedMessage);
  };

  if (!isOpen) {
    return (
      <>
        <style jsx global>{`
          @keyframes homemate-launcher-in {
            from {
              opacity: 0;
              transform: translateY(10px) scale(0.86);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes homemate-ring {
            0%,
            100% {
              transform: scale(1);
              opacity: 0.28;
            }
            50% {
              transform: scale(1.22);
              opacity: 0.08;
            }
          }
        `}</style>

        <button
          type="button"
          aria-label="Open HomeMate chatbot"
          onClick={onOpen}
          className="group relative grid h-16 w-16 place-items-center rounded-full bg-[#20b35c] text-white shadow-[0_14px_30px_rgba(32,179,92,0.35)] transition hover:-translate-y-0.5 hover:bg-[#1aa552] hover:shadow-[0_18px_38px_rgba(32,179,92,0.42)]"
          style={{ animation: "homemate-launcher-in 220ms ease-out both" }}
        >
          <span
            className="absolute inset-0 rounded-full bg-[#20b35c]"
            style={{ animation: "homemate-ring 1800ms ease-in-out infinite" }}
          />
          <span className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-300" />
          <span className="relative">
            <ChatbotIcon />
          </span>
        </button>
      </>
    );
  }

  return (
    <section
      className={`relative h-[min(560px,calc(100vh-96px))] w-[min(360px,calc(100vw-32px))] origin-bottom-right overflow-hidden rounded-[26px] border border-white/70 bg-[#f7fffb] shadow-[0_22px_60px_rgba(15,82,45,0.22)] transition-all duration-220 ease-out ${
        isPanelVisible && !isClosing
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-4 scale-95 opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_92%,rgba(38,173,95,0.2),transparent_34%),radial-gradient(circle_at_8%_18%,rgba(38,173,95,0.12),transparent_28%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(ellipse_at_center,rgba(38,173,95,0.12),transparent_68%)]" />

      <div className="relative z-10 flex h-full flex-col">
        <header className="flex items-center justify-between bg-[#20b35c] px-4 py-3 text-white shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/45 bg-white/15">
              <ChatbotIcon />
            </span>

            <div className="min-w-0 leading-tight">
              <h2 className="truncate text-base font-semibold">HomeMate</h2>
              <p className="truncate text-[11px] font-medium text-white/90">
                Your Verified Property Assistant
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close chatbot"
            onClick={handleClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/15"
          >
            <IoClose className="h-5 w-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4 pt-5">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {messages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                className={`max-w-[260px] rounded-2xl px-4 py-3 text-xs leading-5 shadow-sm backdrop-blur ${
                  chatMessage.role === "user"
                    ? "ml-auto rounded-tr-md bg-[#dff9eb] text-gray-800"
                    : "rounded-tl-md bg-white/80 text-gray-700"
                }`}
              >
                {chatMessage.text}
              </div>
            ))}

            {chatbotMutation.isPending ? (
              <div className="inline-flex rounded-2xl rounded-tl-md bg-white/80 px-4 py-3 text-xs text-gray-500 shadow-sm">
                Thinking...
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={chatbotMutation.isPending}
                className="rounded-full border border-[#20b35c]/15 bg-white/85 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:border-[#20b35c]/35 hover:text-[#168a48]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="mt-auto flex h-12 items-center rounded-full border border-gray-100 bg-white px-4 shadow-[0_8px_24px_rgba(15,23,42,0.16)]"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(message);
            }}
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Chat here..."
              aria-label="Chat message"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-500"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={chatbotMutation.isPending}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#20b35c] text-white transition hover:bg-[#168a48]"
            >
              <IoSend className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HomeMateChatbot;
