"use client";

import { Bug, Compass } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const Home = () => {
  const [activeMode, setActiveMode] = useState("bughunter");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 🎯 Auto-resize textarea height as content grows up to max-height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) {
      console.log("Prompt is required");
      return;
    }

    setLoading(true);
    console.log(prompt);

    const endPoint =
      activeMode === "bughunter"
        ? "/api/chat/bughunter"
        : "/api/chat/blueprint";

    try {
      const response = await fetch(endPoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      console.log(data);
      router.push(`/c/${data.projectId}`);
    } catch (error) {
      console.error("Failed to generate project:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Logo Section */}
      <div className="flex gap-2 justify-center z-10 select-none">
        <span className="text-5xl font-semibold text-purple-600 tracking-tight">
          {"{ "}
          {" }"}
        </span>
        <h1 className="text-4xl font-semibold mt-1 tracking-tight text-white">
          Aero<span className="text-4xl text-purple-600 font-bold">Code</span>
        </h1>
      </div>

      {/* Main Container for Input and Badges */}
      <div className="flex flex-col items-center mt-10 w-full z-10">
        {/* Dynamic Multi-line Input Box Wrapper */}
        <div className="w-full max-w-3xl px-4">
          <div className="flex items-end bg-[#111112] border border-zinc-800/90 rounded-2xl p-2 pl-4 shadow-2xl focus-within:border-purple-500/80 focus-within:ring-2 focus-within:ring-purple-500/10 transition-all duration-300">
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                activeMode === "bughunter"
                  ? "Ask BugHunter to find bugs and clean your code..."
                  : "Ask Blueprint to architect system structure and database..."
              }
              className="w-full bg-transparent text-white placeholder-zinc-500 text-sm py-2 outline-none resize-none max-h-[200px] min-h-[36px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent disabled:opacity-50"
            />

            {/* Premium Up Arrow Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              className="p-2.5 mb-0.5 mx-1 cursor-pointer bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-900 text-white disabled:text-zinc-600 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20 disabled:shadow-none group"
              title="Send message"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="text-[11px] text-zinc-600 mt-2 pl-2 select-none">
            Press Enter to send, Shift + Enter for new lines
          </div>
        </div>

        {/* Mode Badges */}
        <div className="flex gap-3 mt-6 justify-center">
          {/* Bug Hunter Button */}
          <button
            onClick={() => !loading && setActiveMode("bughunter")}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium cursor-pointer transition-all duration-200 ${
              activeMode === "bughunter"
                ? "bg-purple-600/10 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/5"
                : "bg-transparent border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800 disabled:opacity-40"
            }`}
          >
            <Bug size={14} />
            <span>Bug Hunter</span>
          </button>

          {/* Blueprint Button */}
          <button
            onClick={() => !loading && setActiveMode("blueprint")}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium cursor-pointer transition-all duration-200 ${
              activeMode === "blueprint"
                ? "bg-purple-600/10 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/5"
                : "bg-transparent border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800 disabled:opacity-40"
            }`}
          >
            <Compass size={14} />
            <span>Blueprint</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
