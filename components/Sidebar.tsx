"use client";

import {
  SidebarOpen,
  SidebarClose,
  Edit,
  Compass,
  Bug,
  Trash2, 
  Settings,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { BiDotsVertical } from "react-icons/bi";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false); // Desktop toggle state
  const [isMobileOpen, setIsMobileOpen] = useState(false); // 🎯 Mobile toggle state
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

  // Auto-close mobile menu when screen size scales to desktop bounds
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* 🎯 1. MOBILE/TABLET FLOATING HEADER TRIGGER (Top Left Lines Trigger) */}
      <div className="fixed top-0 left-0 h-16 px-4 flex items-center md:hidden z-50 pointer-events-none">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-[#0d0d0e]/90 border border-zinc-800/80 text-zinc-400 hover:text-white pointer-events-auto shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          {isMobileOpen ? <X size={20} className="text-purple-500 animate-fadeIn" /> : <Menu size={20} className="animate-fadeIn" />}
        </button>
      </div>

      {/* 🎯 2. MOBILE BACKDROP OVERLAY SHADE */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fadeIn duration-200"
        />
      )}

      {/* 3. SIDEBAR SHELL CONTAINER */}
      <div
        className={`fixed top-0 left-0 h-[100svh] bg-[#0d0d0e] border-r border-zinc-800/90 text-zinc-400 flex flex-col z-40 transition-all duration-300 ease-in-out overflow-hidden
          ${/* Desktop Dimensions */ ""}
          ${isOpen ? "md:w-[55px]" : "md:w-[260px]"}
          ${/* Mobile/Tablet Dimensions Positioning Sliding Actions */ ""}
          ${isMobileOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full md:translate-x-0"}
        `}
      >
        {/* logo area */}
        <div className="flex px-4 items-center justify-between border-b border-zinc-800/60 h-16 w-full shrink-0 relative overflow-hidden pl-14 md:pl-4">
          {isOpen ? (
            <div className="flex w-full justify-center items-center absolute inset-0 mx-auto animate-fadeIn duration-200 hidden md:flex">
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
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="text-purple-600 text-xl font-bold cursor-pointer shrink-0">
                  {"{ }"}
                </span>
                <h1 className="text-white text-md font-semibold cursor-pointer mt-0.5 tracking-tight">
                  AeroCode<span className="text-purple-600 font-bold">.</span>
                </h1>
              </Link>

              {/* Toggle hidden completely on Mobile/Tablets view to preserve layout rules */}
              <button
                onClick={() => setIsOpen(true)}
                className="p-1 rounded-lg text-zinc-400 cursor-pointer transition-all duration-200 hover:text-white/70 shrink-0 hidden md:block"
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
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg hover:bg-zinc-800/30 transition-all text-sm font-medium hover:text-white ${
                    isOpen ? "md:justify-center" : "gap-2.5"
                  }`}
                >
                  {item.icon}
                  <span 
                    className={`whitespace-nowrap transition-all duration-200 ${
                      isOpen ? "md:opacity-0 md:w-0 md:pointer-events-none md:invisible" : "opacity-100 visible"
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
              isOpen ? "md:opacity-0 md:invisible md:h-0 md:mb-0" : "opacity-100 visible"
            }`}
          >
            Recents
          </h1>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 max-h-[calc(100svh-340px)] scrollbar-none">
            <div 
              className={`group relative bg-zinc-800/20 hover:bg-zinc-800/50 p-2 rounded-lg cursor-pointer flex items-center transition-all duration-200 border border-transparent hover:border-zinc-800/40 h-10 ${
                isOpen ? "md:justify-center md:pl-0" : "justify-between md:pl-3 pl-3"
              }`}
            >
              {!(isOpen) && (
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
          <div className={`flex items-center w-full ${isOpen ? "md:justify-center" : "justify-between px-1"}`}>
            
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-inner select-none">
                H
              </div>
              
              <div 
                className={`flex flex-col min-w-0 transition-all duration-200 ${
                  isOpen ? "md:opacity-0 md:w-0 md:pointer-events-none md:invisible" : "opacity-100 visible"
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

            {(!isOpen) && (
              <Link 
                href="/settings" 
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/40 transition-all duration-200 cursor-pointer animate-fadeIn"
                title="Settings"
              >
                <Settings size={18} />
              </Link>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default Sidebar;