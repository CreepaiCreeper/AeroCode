"use client";
import { Bug, Compass } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const Home = () => {
  const [activeMode, setActiveMode] = useState("bughunter");
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      console.log("Prompt is requerd");
      return;
    }
    console.log(prompt);

    const endPoint =
      activeMode === "bughunter"
        ? "/api/chat/bughunter"
        : "/api/chat/blueprint";

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
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Logo Section */}
      <div className="flex gap-2 justify-center">
        <span className="text-5xl font-semibold text-purple-600">
          {"{ "}
          {" }"}
        </span>
        <h1 className="text-4xl font-semibold mt-1">
          Aero<span className="text-4xl text-purple-600">Code</span>
        </h1>
      </div>

      {/* Main Container for Input and Badges */}
      <div className="flex flex-col items-center mt-10 w-full">
        {/* Input Box Wrapper */}
        <div className="w-full max-w-3xl px-4">
          <div className="flex items-center bg-[#141414] border border-zinc-800/80 rounded-full p-1 pl-4 shadow-2xl focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all duration-300">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeMode === "bughunter"
                  ? "Ask BugHunter to find bugs and clean your code..."
                  : "Ask Blueprint to architect system structure and database..."
              }
              className="w-full bg-transparent text-white placeholder-zinc-500 text-sm py-2 outline-none text-[14px]"
            />
            <button
              onClick={handleSubmit}
              className="p-2.5 mx-1 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 flex items-center justify-center group shrink-0 shadow-md shadow-purple-600/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 19.5L19.5 4.5m0 0H8.25m11.25 0v11.25"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-4 justify-center">
          <button
            onClick={() => setActiveMode("bughunter")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium cursor-pointer transition-all duration-200 ${
              activeMode === "bughunter"
                ? "bg-purple-600/10 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/5"
                : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
            }`}
          >
            <Bug size={14} />
            <span>Bug Hunter</span>
          </button>

          {/* Blueprint Button */}
          <button
            onClick={() => setActiveMode("blueprint")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium cursor-pointer transition-all duration-200 ${
              activeMode === "blueprint"
                ? "bg-purple-600/10 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/5"
                : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
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
