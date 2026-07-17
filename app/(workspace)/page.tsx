"use client";

import { Bug, Compass, LogIn, UserPlus } from "lucide-react";
import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth"; 

const Home = () => {
  const [activeMode, setActiveMode] = useState("bughunter");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const isLoggedIn = useAuth();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [authStatus, setAuthStatus] = useState<boolean>(false);

  useEffect(() => {
    if (isLoggedIn !== null) {
      setAuthStatus(isLoggedIn);
    } else if (typeof window !== "undefined") {
      const localCheck = localStorage.getItem("isLoggedIn") === "true";
      setAuthStatus(localCheck);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const checkDatabase = async () => {
      if (authStatus) {
        try {
          const response = await fetch("/api/auth/me", { method: "GET" });
          if (!response.ok) {
            localStorage.clear();
            setAuthStatus(false);
            window.dispatchEvent(new Event("auth-change")); 
          }
        } catch (err) {
          console.error("DB Check failed", err);
        }
      }
    };

    checkDatabase();
  }, [authStatus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/auth/me", { method: "GET" });
      if (!response.ok) {
        localStorage.clear();
        setAuthStatus(false);
        window.dispatchEvent(new Event("auth-change"));
        setErrorMessage("Your account no longer exists. Please sign up again.");
        return;
      }
    } catch {
      setErrorMessage("Auth check failed.");
      return;
    }

    if (!prompt.trim() || loading) return;

    setLoading(true);
    setErrorMessage(null);

    const endPoint =
      activeMode === "bughunter"
        ? "/api/chat/bughunter"
        : "/api/chat/blueprint";

    try {
      const response = await fetch(endPoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      const targetId = data.projectId || data.id || (data.data && data.data.projectId);

      if (targetId) {
        // 🌟 pehle navigate, phir refresh — bina hard reload ke live update
        startTransition(() => {
          router.push(`/c/${targetId}`);
          router.refresh();
        });
      } else {
        setErrorMessage("Project creation failed. Please check server responses.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="h-[100svh] flex flex-col items-center justify-center relative overflow-hidden px-4 md:pl-[260px]">
      
      {!authStatus && (
        <div className="absolute top-5 right-5 flex items-center gap-4 z-50 animate-fadeIn">
          <Link
            href="/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 bg-[#111112]/90 hover:bg-zinc-800 text-zinc-200 hover:text-white text-sm font-bold tracking-wide transition-all active:scale-95 cursor-pointer backdrop-blur-md shadow-lg"
          >
            <LogIn size={15} />
            Login
          </Link>
          
          <Link
            href="/signup"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold tracking-wide transition-all active:scale-95 cursor-pointer shadow-lg shadow-purple-600/20"
          >
            <UserPlus size={15} />
            Sign Up
          </Link>
        </div>
      )}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex gap-2 justify-center z-10 select-none">
        <span className="text-5xl font-semibold text-purple-600 tracking-tight">
          {"{ "}{" }"}
        </span>
        <h1 className="text-4xl font-semibold mt-1 tracking-tight text-white">
          Aero<span className="text-4xl text-purple-600 font-bold">Code</span>
        </h1>
      </div>

      <div className="flex flex-col items-center mt-10 w-full z-10">
        <div className="w-full max-w-3xl">
          
          <div className={`flex items-end bg-[#111112] border rounded-2xl p-2 pl-4 shadow-2xl transition-all duration-300
            ${!authStatus 
              ? "border-zinc-800/40 opacity-60" 
              : "border-zinc-800/90 focus-within:border-purple-500/80 focus-within:ring-2 focus-within:ring-purple-500/10"
            }`}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading || !authStatus}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                authStatus 
                  ? "Ask anything, discuss concepts or ideas..." 
                  : "Please login from top-right corner to start chatting..."
              }
              className="w-full bg-transparent text-white placeholder-zinc-500 text-sm py-2 outline-none resize-none max-h-[200px] min-h-[36px] leading-relaxed disabled:opacity-70"
            />

            <button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim() || !authStatus}
              className="p-2.5 mb-0.5 mx-1 cursor-pointer bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-900 text-white disabled:text-zinc-600 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20 group"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 transform group-hover:-translate-y-0.5 transition-transform duration-200"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1-1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="text-xs font-medium text-red-500 mt-3 pl-2 animate-pulse">
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="text-[11px] text-zinc-600 mt-2 pl-2 select-none">
            {authStatus ? "Press Enter to send, Shift + Enter for new lines" : "Authentication required"}
          </div>
        </div>

        {/* Modes Section — sirf Bug Hunter + Blueprint */}
        <div className="flex gap-3 mt-6 justify-center">
          <button
            onClick={() => !loading && authStatus && setActiveMode("bughunter")}
            disabled={loading || !authStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all duration-200 
              ${!authStatus ? "opacity-50 border-zinc-900 text-zinc-500" : ""}
              ${authStatus && activeMode === "bughunter"
                ? "bg-purple-600/10 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/5 cursor-pointer"
                : authStatus ? "bg-transparent border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800 cursor-pointer" : ""
              }`}
          >
            <Bug size={14} />
            <span>Bug Hunter</span>
          </button>

          <button
            onClick={() => !loading && authStatus && setActiveMode("blueprint")}
            disabled={loading || !authStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all duration-200
              ${!authStatus ? "opacity-50 border-zinc-900 text-zinc-500" : ""}
              ${authStatus && activeMode === "blueprint"
                ? "bg-purple-600/10 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/5 cursor-pointer"
                : authStatus ? "bg-transparent border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800 cursor-pointer" : ""
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