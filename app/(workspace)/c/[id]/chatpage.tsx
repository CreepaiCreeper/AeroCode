"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Check,
  Copy,
  Terminal,
  ChevronDown,
  ChevronUp,
  Lock,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";

type Message = {
  id: string;
  content: string;
  role: string;
};

interface ChatPageProps {
  messages: Message[];
  projectId: string;
  mode: string;
}

const ChatMessageItem = ({
  msg,
  mode,
  renderMessageContent,
}: {
  msg: Message;
  mode: string;
  renderMessageContent: (content: string, msgId: string) => React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 600;
  const shouldTruncate = msg.role === "user" && msg.content.length > maxLength;
  const displayContent =
    shouldTruncate && !isExpanded
      ? msg.content.slice(0, maxLength) + "..."
      : msg.content;

  return (
    <div className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl px-5 py-4 w-full shadow-2xl border transition-all duration-300 ${
          msg.role === "user"
            ? "bg-purple-600/5 border-purple-500/20 text-white self-end max-w-[90%] sm:max-w-[85%]"
            : "bg-[#111112] border-zinc-800/90 text-zinc-200 max-w-full"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
            {msg.role === "user"
              ? "You"
              : `${mode === "blueprint" ? "📐 Blueprint" : mode === "normal" ? "💬 AeroCode" : "🪲 BugHunter"} AI`}
          </span>
        </div>

        <div className="space-y-1 w-full overflow-hidden transition-all duration-300">
          {renderMessageContent(displayContent, msg.id)}
        </div>

        {shouldTruncate && (
          <div className="mt-3 pt-2 border-t border-zinc-800/40 flex justify-start">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors cursor-pointer bg-purple-500/5 hover:bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/10"
            >
              {isExpanded ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp size={14} />
                </>
              ) : (
                <>
                  <span>Show More</span>
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatPage = ({ messages, projectId, mode }: ChatPageProps) => {
  const [prompt, setPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>(messages);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // 🌟 Hydration Mismatch Safety Hook
  const [hasMounted, setHasMounted] = useState(false);
  const [authStatus, setAuthStatus] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = useAuth();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      const localCheck = typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true";
      setAuthStatus(isLoggedIn ?? localCheck);
    }
  }, [isLoggedIn, hasMounted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleSend = async () => {
    if (!authStatus || !prompt.trim() || loading) return;

    const userMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: prompt,
      role: "user",
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt("");
    setLoading(true);

    try {
      // Endpoint Selector based on mode
      const apiRoute =
        mode === "normal"
          ? "/api/chat/normal"
          : mode === "blueprint"
          ? "/api/chat/blueprint"
          : "/api/chat/bughunter";

      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt,
          projectId: projectId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: data.messageId || `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: data.data || data.content || "No response received",
            role: "assistant",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, blockId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(blockId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : "code";
        const codeText = match ? match[2].trim() : part.replace(/```/g, "").trim();
        const blockId = `${msgId}-block-${index}`;

        return (
          <div key={blockId} className="my-4 overflow-hidden rounded-xl border border-zinc-800 bg-[#0d0d0e] shadow-2xl w-full">
            <div className="flex items-center justify-between border-b border-zinc-800/60 bg-[#161617] px-4 py-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-purple-400">
                <Terminal size={12} />
                {language || "code"}
              </div>
              <button
                onClick={() => handleCopy(codeText, blockId)}
                className="flex items-center gap-1 rounded px-2 py-1 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                {copiedId === blockId ? (
                  <>
                    <Check className="text-emerald-400" size={12} />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-zinc-200 bg-zinc-950/40">
              <pre className="whitespace-pre">{codeText}</pre>
            </div>
          </div>
        );
      }

      const renderBoldText = (text: string) => {
        const textParts = text.split(/(\*\*[\s\S]*?\*\*)/g);
        return textParts.map((subPart, subIndex) => {
          if (subPart.startsWith("**") && subPart.endsWith("**")) {
            return (
              <strong key={`bold-${subIndex}`} className="font-bold text-white">
                {subPart.slice(2, -2)}
              </strong>
            );
          }
          return subPart;
        });
      };

      if (part.trim().startsWith("#")) {
        const cleanHeader = part.replace(/^#+\s*/, "");
        return (
          <h3 key={`header-${index}`} className="text-[15px] font-bold text-white mt-4 mb-2 tracking-wide block">
            {renderBoldText(cleanHeader)}
          </h3>
        );
      }

      return (
        <p key={`text-${index}`} className="whitespace-pre-wrap leading-relaxed text-[14.5px] text-zinc-200 my-1 block">
          {renderBoldText(part)}
        </p>
      );
    });
  };

  // 🌟 Hydration mismatch se bachane ke liye pehla render standard rakhein
  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased">
      <div className="md:pl-[260px] min-h-screen flex flex-col justify-between relative">
        <div className="flex-1 overflow-y-auto p-4 pb-36 w-full flex flex-col items-center pt-8 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="w-full max-w-4xl space-y-6">
            {chatMessages.map((msg, idx) => (
              <ChatMessageItem
                key={`${msg.id}-${idx}`}
                msg={msg}
                mode={mode}
                renderMessageContent={renderMessageContent}
              />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 text-xs rounded-full px-5 py-2.5 animate-pulse flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping"></span>
                  AeroCode is processing with {mode}...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Input Controller */}
        <div className="fixed bottom-0 left-0 md:left-[260px] right-0 flex justify-center bg-gradient-to-t from-black via-black/90 to-transparent pt-10 pb-6 z-40">
          <div className="w-full max-w-4xl px-4">
            <div
              className={`flex items-end bg-[#141415] border rounded-2xl p-2 pl-4 shadow-2xl transition-all duration-300 ${
                authStatus
                  ? "border-zinc-800/90 focus-within:border-purple-500/80 focus-within:ring-2 focus-within:ring-purple-500/10"
                  : "border-red-500/20 bg-red-950/5 select-none"
              }`}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading || !authStatus}
                placeholder={
                  authStatus
                    ? "Type a message..."
                    : "Please login from top-right corner to start chatting..."
                }
                className="w-full bg-transparent text-white placeholder-zinc-500 text-sm py-2 outline-none resize-none max-h-[200px] min-h-[36px] leading-relaxed custom-scrollbar disabled:opacity-50"
              />

              {authStatus ? (
                <button
                  onClick={handleSend}
                  disabled={loading || !prompt.trim()}
                  className="p-3 mb-0.5 mx-1 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:shadow-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              ) : (
                <div className="p-3 mb-0.5 mx-1 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-center shrink-0 shadow-sm" title="Authentication Required">
                  <Lock size={16} className="animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;