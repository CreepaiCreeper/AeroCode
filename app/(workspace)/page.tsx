"use client";

import { Bug, Compass, LogIn, UserPlus } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth"; 

const Home = () => {
  const [activeMode, setActiveMode] = useState("blueprint");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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
    if (!prompt.trim() || loading) return;

    if (!authStatus) {
      setErrorMessage("Please login or sign up to create a workspace session.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const authResponse = await fetch("/api/auth/me", { method: "GET" });
      if (!authResponse.ok) {
        localStorage.clear();
        setAuthStatus(false);
        window.dispatchEvent(new Event("auth-change"));
        setErrorMessage("Your account session is invalid. Please sign up again.");
        setLoading(false);
        return;
      }

      const apiRoute =
        activeMode === "blueprint"
          ? "/api/chat/blueprint"
          : "/api/chat/bughunter";

      const chatResponse = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await chatResponse.json();

      if (data.success && data.projectId) {
        // 🌟 FIX: router.refresh() Sidebar (server component) ko force fresh data fetch karayega
        router.refresh();
        router.push(`/c/${data.projectId}`);
      } else {
        setErrorMessage(data.message || "Something went wrong while processing.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error occurred. Failed to submit prompt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute top-6 right-6 flex items-center gap-3">
        {!authStatus ? (
          <>
            <Link href="/login" className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:text-white transition-all text-zinc-300">
              <LogIn size={13} />
              Login
            </Link>
            <Link href="/signup" className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-purple-600 rounded-xl hover:bg-purple-700 transition-all text-white shadow-lg shadow-purple-600/10">
              <UserPlus size={13} />
              Sign Up
            </Link>
          </>
        ) : (
          <div className="text-xs font-bold text-purple-400 bg-purple-500/5 px-4 py-2 rounded-xl border border-purple-500/10 tracking-wide select-none">
            
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl space-y-8 text-center relative z-10">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white select-none">
            AeroCode<span className="text-purple-500">.AI</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto">
            The multi-engine companion built for realistic chats, full-stack software architecture blueprints, and strict bug hunts.
          </p>
        </div>

        {/* Updated Dual-Engine Toggle Matrix */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto bg-[#0d0d0e] border border-zinc-900 p-1.5 rounded-2xl shadow-xl">
          <button
            onClick={() => setActiveMode("blueprint")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              activeMode === "blueprint"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
                : "text-zinc-400 hover:text-white hover:bg-zinc-950"
            }`}
          >
            <Compass size={14} />
            <span>Blueprint Matrix</span>
          </button>
          <button
            onClick={() => setActiveMode("bughunter")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              activeMode === "bughunter"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
                : "text-zinc-400 hover:text-white hover:bg-zinc-950"
            }`}
          >
            <Bug size={14} />
            <span>BugHunter</span>
          </button>
        </div>

        <div className="w-full bg-[#0d0d0e] border border-zinc-900 rounded-3xl p-3 shadow-2xl focus-within:border-purple-500/40 transition-colors">
          <div className="flex items-end pl-3 pr-1 py-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                activeMode === "blueprint"
                  ? "Describe a platform feature or system concept to build a layout blueprint..."
                  : "Paste broken code stacks, logs, or error blocks here to analyze bugs..."
              }
              className="w-full bg-transparent text-white placeholder-zinc-500 text-sm outline-none resize-none max-h-[200px] min-h-[44px] pt-2.5 leading-relaxed custom-scrollbar"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl transition-all duration-200 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20 disabled:bg-zinc-900 disabled:text-zinc-700 disabled:shadow-none cursor-pointer h-11 w-11"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="max-w-md mx-auto text-xs bg-red-500/5 text-red-400 border border-red-500/10 px-4 py-3 rounded-xl animate-fade-in select-none">
            ⚠️ {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;