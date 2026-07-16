"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  Camera,
} from "lucide-react";

const SettingsPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentSub, setShowCurrentSub] = useState(false);
  const [showNewSub, setShowNewSub] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          setUsername(data.user.name);
          setEmail(data.user.email);
          setAvatarPreview(data.user.image || null);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage("Image size 2MB se kam honi chahiye");
      setProfileSuccess(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setProfileMessage("Username khali nahi ho sakta");
      setProfileSuccess(false);
      return;
    }

    setSavingProfile(true);
    setProfileMessage("");

    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username.trim(),
          image: avatarPreview,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProfileMessage("Profile updated successfully!");
        setProfileSuccess(true);

        // 🌟 Sidebar ko instantly sync karo
        localStorage.setItem("userName", data.user.name);
        if (data.user.image) {
          localStorage.setItem("userImage", data.user.image);
        } else {
          localStorage.removeItem("userImage");
        }
        window.dispatchEvent(new Event("auth-change"));
      } else {
        setProfileMessage(data.message || "Update failed");
        setProfileSuccess(false);
      }
    } catch (err) {
      setProfileMessage("Something went wrong. Please try again!");
      setProfileSuccess(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("All fields are required");
      setPasswordSuccess(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match!");
      setPasswordSuccess(false);
      return;
    }

    setSavingPassword(true);
    setPasswordMessage("");

    try {
      const res = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPasswordMessage("Password changed successfully!");
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage(data.message || "Password change failed");
        setPasswordSuccess(false);
      }
    } catch (err) {
      setPasswordMessage("Something went wrong. Please try again!");
      setPasswordSuccess(false);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.clear();
      window.dispatchEvent(new Event("auth-change"));
      window.location.href = "/";
    }
  };

  const handleDeleteAccount = async () => {
    const confirmBox = confirm(
      "Are you absolutely sure you want to delete your AeroCode account permanently?",
    );
    if (!confirmBox) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        localStorage.clear();
        window.dispatchEvent(new Event("auth-change"));
        window.location.href = "/";
      } else {
        alert(data.message || "Delete failed");
        setDeleting(false);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again!");
      setDeleting(false);
    }
  };

  const firstLetter = username ? username.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-[100svh] bg-[#09090b] text-zinc-300 font-sans antialiased selection:bg-purple-600/30 selection:text-purple-400">
      <header className="h-16 border-b border-zinc-800/60 px-4 md:px-8 flex items-center gap-4 bg-[#0d0d0e]/80 backdrop-blur-md sticky top-0 z-10">
        <Link
          href="/"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/40 transition-all duration-200 cursor-pointer flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-md font-semibold text-white tracking-tight">Account Settings</h1>
          <p className="text-[11px] text-zinc-500 font-medium">Manage your AeroCode profile security</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* SECTION A: PROFILE */}
        <section className="bg-[#0d0d0e] border border-zinc-800/80 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 border-b border-zinc-800/40 pb-3">
            <User size={18} className="text-purple-500" />
            <h2 className="text-sm font-semibold text-white tracking-wide">Your Profile</h2>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex items-center gap-5">
              <div
                onClick={triggerFileInput}
                className="relative group cursor-pointer w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-800/50 hover:border-purple-600/50 transition-all duration-200 shrink-0"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-md select-none">
                    {firstLetter}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera size={18} className="text-white" />
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex flex-col items-start gap-2">
                <div>
                  <h3 className="text-sm font-medium text-zinc-200">Profile Picture</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Click avatar window to select and load local image asset</p>
                </div>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs font-medium text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/20 bg-zinc-800/20 hover:bg-red-500/10 px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400 pl-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#121214] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-600 transition-colors duration-200 placeholder:text-zinc-600 font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-500 pl-1 select-none">Email Address (Locked)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  title="Email settings can't be changed"
                  className="bg-[#0a0a0b] border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-500 cursor-not-allowed select-none font-medium opacity-70"
                />
              </div>
            </div>

            {profileMessage && (
              <p className={`text-xs font-medium ${profileSuccess ? "text-green-400" : "text-red-400"}`}>
                {profileMessage}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-medium text-xs px-4 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-purple-600/10"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        {/* SECTION B: PASSWORD */}
        <section className="bg-[#0d0d0e] border border-zinc-800/80 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 border-b border-zinc-800/40 pb-3">
            <Lock size={18} className="text-purple-500" />
            <h2 className="text-sm font-semibold text-white tracking-wide">Update Password</h2>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-medium text-zinc-400 pl-1">Current Password</label>
              <div className="relative w-full">
                <input
                  type={showCurrentSub ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current security password"
                  className="w-full bg-[#121214] border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-purple-600 transition-colors duration-200 placeholder:text-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentSub(!showCurrentSub)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showCurrentSub ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400 pl-1">New Password</label>
                <div className="relative w-full">
                  <input
                    type={showNewSub ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-[#121214] border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-purple-600 transition-colors duration-200 placeholder:text-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewSub(!showNewSub)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showNewSub ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400 pl-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="bg-[#121214] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-600 transition-colors duration-200 placeholder:text-zinc-700"
                />
              </div>
            </div>

            {passwordMessage && (
              <p className={`text-xs font-medium ${passwordSuccess ? "text-green-400" : "text-red-400"}`}>
                {passwordMessage}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-medium text-xs px-4 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-purple-600/10"
              >
                {savingPassword ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>
        </section>

        {/* SECTION C: DANGER ZONE */}
        <section className="bg-[#0d0d0e] border border-red-950/40 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/40 pb-3">
            <h2 className="text-[#ef4444] tracking-wide text-xs font-bold uppercase">Danger Zone</h2>
          </div>

          <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
            Actions here are critical to your application profile account data logs. Please proceed with security caution.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-zinc-800/30 border border-zinc-800 hover:bg-zinc-800/80 text-zinc-300 hover:text-white font-medium text-xs px-4 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <LogOut size={14} />
              Logout Session
            </button>

            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 font-medium text-xs px-4 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;