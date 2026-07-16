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
  X,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { BiDotsVertical } from "react-icons/bi";
import { useAuth } from "@/app/hooks/useAuth";

type Project = {
  id: string;
  title: string;
};

const Sidebar = ({
  projects: initialProjects = [],
}: {
  projects?: Project[];
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState<Project[]>(initialProjects);

  const [userName, setUserName] = useState<string>("User");
  const [userRole, setUserRole] = useState<string>("Pro Developer");
  const [userImage, setUserImage] = useState<string | null>(null);

  const isLoggedIn = useAuth();
  const [authStatus, setAuthStatus] = useState<boolean>(false);

  useEffect(() => {
    if (isLoggedIn !== null) {
      setAuthStatus(isLoggedIn);
    } else {
      const localFlag = typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true";
      setAuthStatus(localFlag);
    }
  }, [isLoggedIn]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (authStatus) {
        const storedName = localStorage.getItem("userName") || "Kenji";
        const storedRole = localStorage.getItem("userRole") || "Developer";
        const storedImage = localStorage.getItem("userImage");
        setUserName(storedName);
        setUserRole(storedRole);
        setUserImage(storedImage);
        setLocalProjects(initialProjects);
      } else {
        setUserName("");
        setUserRole("");
        setUserImage(null);
        setLocalProjects([]);
        setActiveMenuId(null);
        setEditingId(null);
      }
    }
  }, [authStatus, initialProjects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".menu-container")) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    if (loadingActionId) return;
    setLoadingActionId(projectId);

    try {
      const response = await fetch("/api/project/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const resData = await response.json();

      if (resData.success) {
        setLocalProjects((prev) => prev.filter((p) => p.id !== projectId));
        setActiveMenuId(null);
        if (window.location.pathname.includes(`/c/${projectId}`)) {
          window.location.href = "/";
        }
      } else {
        alert(resData.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleRenameProject = async (projectId: string) => {
    if (!editTitle.trim() || loadingActionId) return;
    setLoadingActionId(projectId);

    try {
      const response = await fetch("/api/project/rename", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, newTitle: editTitle.trim() }),
      });

      const resData = await response.json();

      if (resData.success) {
        setLocalProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, title: editTitle.trim() } : p))
        );
        setEditingId(null);
        setActiveMenuId(null);
      } else {
        alert(resData.message || "Rename failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActionId(null);
    }
  };

  const firstLetter = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <>
      <div className="fixed top-0 left-0 h-16 px-4 flex items-center md:hidden z-50 pointer-events-none">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-[#0d0d0e]/90 border border-zinc-800/80 text-zinc-400 hover:text-white pointer-events-auto shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          {isMobileOpen ? (
            <X size={20} className="text-purple-500 animate-fadeIn" />
          ) : (
            <Menu size={20} className="animate-fadeIn" />
          )}
        </button>
      </div>

      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
        />
      )}

      <div
        className={`fixed top-0 left-0 h-[100svh] bg-[#0d0d0e] border-r border-zinc-800/90 text-zinc-400 flex flex-col z-40 transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? "md:w-[55px]" : "md:w-[260px]"}
          ${isMobileOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex px-4 items-center justify-between border-b border-zinc-800/60 h-16 w-full shrink-0 relative overflow-hidden pl-14 md:pl-4">
          {isOpen ? (
            <div className="flex w-full justify-center items-center absolute inset-0 mx-auto hidden md:flex">
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
                className="flex items-center gap-2 whitespace-nowrap"
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="text-purple-600 text-xl font-bold cursor-pointer shrink-0">
                  {"{ }"}
                </span>
                <h1 className="text-white text-md font-semibold cursor-pointer mt-0.5 tracking-tight">
                  AeroCode<span className="text-purple-600 font-bold">.</span>
                </h1>
              </Link>

              <button
                onClick={() => setIsOpen(true)}
                className="p-1 rounded-lg text-zinc-400 cursor-pointer transition-all duration-200 hover:text-white/70 shrink-0 hidden md:block"
              >
                <SidebarClose size={20} />
              </button>
            </>
          )}
        </div>

        <div className="px-1 py-6 shrink-0 overflow-x-hidden">
          <ul className="space-y-1.5">
            {[
              { href: "/", label: "New Chat", icon: <Edit size={18} className="shrink-0" /> },
              { href: "/", label: "Make blueprint", icon: <Compass size={18} className="shrink-0" /> },
              { href: "/", label: "Bug hunter", icon: <Bug size={18} className="shrink-0" /> },
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

        <div className="flex-1 px-1 py-4 border-t border-zinc-900 flex flex-col min-h-0 mb-1.5">
          <h1
            className={`text-xs font-semibold text-zinc-500 tracking-wider px-3 select-none uppercase mb-3 transition-all duration-200 ${
              isOpen ? "md:opacity-0 md:invisible md:h-0 md:mb-0" : "opacity-100 visible"
            }`}
          >
            Recents
          </h1>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 max-h-[calc(100svh-340px)] scrollbar-none">
            {localProjects.map((project) => (
              <div
                key={project.id}
                className={`group relative bg-zinc-800/20 hover:bg-zinc-800/50 p-2 rounded-lg flex items-center transition-all duration-200 border border-transparent hover:border-zinc-800/40 h-10 ${
                  isOpen ? "md:justify-center md:pl-0" : "justify-between md:pl-3 pl-3"
                }`}
              >
                {!isOpen && (
                  <>
                    {editingId === project.id ? (
                      <div className="flex items-center gap-1 w-full mr-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameProject(project.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          disabled={loadingActionId === project.id}
                          className="bg-zinc-900 border border-purple-500 text-xs rounded px-1.5 py-0.5 text-white outline-none w-full font-medium"
                        />
                        <button
                          onClick={() => handleRenameProject(project.id)}
                          className="p-1 text-green-400 hover:text-green-300 transition-all cursor-pointer"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/c/${project.id}`}
                        className={`text-sm text-zinc-300 truncate pr-2 flex-1 hover:text-white ${
                          loadingActionId === project.id ? "opacity-40 pointer-events-none" : ""
                        }`}
                      >
                        {project.title}
                      </Link>
                    )}

                    {editingId !== project.id && (
                      <div className="relative menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === project.id ? null : project.id);
                          }}
                          disabled={loadingActionId === project.id}
                          className="p-1 rounded text-zinc-500 hover:text-white transition-all"
                        >
                          <BiDotsVertical size={16} className="cursor-pointer" />
                        </button>

                        {activeMenuId === project.id && (
                          <div className="absolute right-0 mt-1.5 w-32 bg-[#141416] border border-zinc-800 rounded-lg shadow-xl py-1 z-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(project.id);
                                setEditTitle(project.title);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all"
                            >
                              <Edit size={13} /> Rename
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs cursor-pointer font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {authStatus && (
          <div className="mt-auto p-3 border-t border-zinc-800/60 bg-[#0a0a0b]/50 shrink-0 w-full min-h-14 flex items-center animate-fadeIn">
            <div className={`flex items-center w-full ${isOpen ? "md:justify-center" : "justify-between px-1"}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-inner select-none uppercase overflow-hidden">
                  {userImage ? (
                    <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    firstLetter
                  )}
                </div>

                <div
                  className={`flex flex-col min-w-0 transition-all duration-200 ${
                    isOpen ? "md:opacity-0 md:w-0 md:pointer-events-none md:invisible" : "opacity-100 visible"
                  }`}
                >
                  <span className="text-sm font-semibold text-zinc-200 truncate tracking-wide">
                    {userName}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium truncate -mt-0.5">
                    {userRole}
                  </span>
                </div>
              </div>

              {!isOpen && (
                <Link
                  href="/settings"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/40 transition-all duration-200 cursor-pointer"
                  title="Settings"
                >
                  <Settings size={18} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;