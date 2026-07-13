"use client";

import {
  SidebarOpen,
  SidebarClose,
  Edit,
  Compass,
  Bug,
  Trash2, 
  Settings,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { BiDotsVertical } from "react-icons/bi";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div
      className={`fixed top-0 left-0 h-[100svh] bg-[#0d0d0e] border-r border-zinc-800/90 text-zinc-400 flex flex-col z-50 hidden md:flex transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? "w-[55px]" : "w-[260px]"
      }`}
    >
      {/* logo area */}
      <div className="flex px-4 items-center justify-between border-b border-zinc-800/60 h-16 w-full shrink-0 relative overflow-hidden">
        {isOpen ? (
          <div className="flex w-full justify-center items-center absolute inset-0 mx-auto animate-fadeIn duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-white/50 hover:text-white/70 cursor-pointer transition-all duration-200"
            >
              <SidebarOpen size={22} />
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/"
              className="flex items-center gap-2 whitespace-nowrap animate-fadeIn duration-200"
            >
              <span className="text-purple-600 text-xl font-bold cursor-pointer shrink-0">
                {"{ }"}
              </span>
              <h1 className="text-white text-md font-semibold cursor-pointer mt-0.5 tracking-tight">
                Aero<span className="text-purple-600 font-bold">Code</span>
              </h1>
            </Link>

            <button
              onClick={() => setIsOpen(true)}
              className="p-1 rounded-lg text-zinc-400 cursor-pointer transition-all duration-200 hover:text-white/70 shrink-0"
            >
              <SidebarClose size={20} />
            </button>
          </>
        )}
      </div>

      {/* chats and more */}
      <div className="px-1 py-6 shrink-0 overflow-x-hidden">
        <ul className="space-y-1.5">
          {[
            { href: "/", label: "New Chat", icon: <Edit size={18} className="shrink-0" /> },
            { href: "/", label: "Make blueprint", icon: <Compass size={18} className="shrink-0" /> },
            { href: "/", label: "Bug hunter", icon: <Bug size={18} className="shrink-0" /> }
          ].map((item, index) => (
            <li key={index}>
              <Link 
                href={item.href} 
                className={`flex items-center px-3 py-2 rounded-lg hover:bg-zinc-800/30 transition-all text-sm font-medium hover:text-white ${
                  isOpen ? "justify-center" : "gap-2.5"
                }`}
              >
                {item.icon}
                {/* 🎯 Opacity 0 and invisible transition setup to stop layout wrapping instantly */}
                <span 
                  className={`whitespace-nowrap transition-all duration-200 ${
                    isOpen ? "opacity-0 w-0 pointer-events-none invisible" : "opacity-100 visible"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* History / Recents Section */}
      <div className="flex-1 px-1 py-4 border-t border-zinc-900 flex flex-col min-h-0 mb-1.5">
        <h1 
          className={`text-xs font-semibold text-zinc-500 tracking-wider px-3 select-none uppercase mb-3 transition-all duration-200 ${
            isOpen ? "opacity-0 invisible h-0 mb-0" : "opacity-100 visible"
          }`}
        >
          Recents
        </h1>

        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 max-h-[calc(100svh-340px)] scrollbar-none">
          <div 
            className={`group relative bg-zinc-800/20 hover:bg-zinc-800/50 p-2 rounded-lg cursor-pointer flex items-center transition-all duration-200 border border-transparent hover:border-zinc-800/40 h-10 ${
              isOpen ? "justify-center pl-0" : "justify-between pl-3"
            }`}
          >
            {/* 🎯 Fix: Removed the bullet dot point layout completely when collapsed */}
            {!isOpen && (
              <>
                <span className="text-sm text-zinc-300 truncate pr-2 animate-fadeIn">
                  Project Setup Design
                </span>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); 
                      setIsMenuOpen(!isMenuOpen); 
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-white transition-all"
                  >
                    <BiDotsVertical size={16} className="cursor-pointer"/>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-32 bg-[#141416] border border-zinc-800 rounded-lg shadow-xl py-1 z-50 animate-fadeIn">
                      <button
                        onClick={() => { alert("Rename Clicked"); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all"
                      >
                        <Edit size={13} />
                        Rename
                      </button>
                      <button
                        onClick={() => { alert("Delete Clicked"); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs cursor-pointer font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Account & Settings Footer Section */}
      <div className="mt-auto p-3 border-t border-zinc-800/60 bg-[#0a0a0b]/50 shrink-0 w-full min-h-14 flex items-center">
        <div className={`flex items-center w-full ${isOpen ? "justify-center" : "justify-between px-1"}`}>
          
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-inner select-none">
              H
            </div>
            
            {/* 🎯 Opacity 0 engine applied to footer user text to prevent glitchy jumps */}
            <div 
              className={`flex flex-col min-w-0 transition-all duration-200 ${
                isOpen ? "opacity-0 w-0 pointer-events-none invisible" : "opacity-100 visible"
              }`}
            >
              <span className="text-sm font-semibold text-zinc-200 truncate tracking-wide">
                Haruto
              </span>
              <span className="text-[10px] text-zinc-500 font-medium truncate -mt-0.5">
                Pro Developer
              </span>
            </div>
          </div>

          {!isOpen && (
            <Link 
              href="/settings" 
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/40 transition-all duration-200 cursor-pointer animate-fadeIn"
              title="Settings"
            >
              <Settings size={18} />
            </Link>
          )}
        </div>
      </div>

    </div>
  );
};

export default Sidebar;