"use client";
import { LockIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdAccountCircle } from "react-icons/md";

const Page = () => {
  const [Name, setName] = useState("");
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!Name || !Email || !Password) {
      setMessage("All fields are required");
      setIsSuccess(false);
      return; 
    }

    // 🌟 FIX: Sirf Gmail aur Outlook emails allow karo
    const emailLower = Email.trim().toLowerCase();
    const isValidDomain =
      emailLower.endsWith("@gmail.com") || emailLower.endsWith("@outlook.com");

    if (!isValidDomain) {
      setMessage("Invalid email addresse");
      setIsSuccess(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: Name,
          email: Email,
          password: Password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Account created successfully!");
        setIsSuccess(true);
        setName("");
        setEmail("");
        setPassword("");

        localStorage.setItem("isLoggedIn", "true");
        if (data.user && data.user.name) {
          localStorage.setItem("userName", data.user.name);
        }
        window.dispatchEvent(new Event("auth-change"));

        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setMessage(data.message || "Account creation failed!");
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again!");
      setIsSuccess(false);
    }
  };

  return (
    <div className="flex h-[100svh] items-center justify-center bg-slate-950 px-4 py-12 selection:bg-purple-500 selection:text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md shadow-2xl shadow-purple-950/20">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 select-none">
            Sign Up
          </h1>
          <p className="text-sm text-zinc-400 mb-8">
            Sign up to get started with your journey
          </p>

          <form className="w-full space-y-5" onSubmit={handleSubmit}>
            <div className="relative flex flex-col justify-center">
              <span className="absolute left-4 text-zinc-400">
                <MdAccountCircle className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Full Name"
                value={Name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 placeholder:text-zinc-500 text-white h-12 rounded-xl pl-12 pr-4 outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white/[0.08]"
              />
            </div>

            <div className="relative flex flex-col justify-center">
              <span className="absolute left-4 text-zinc-400">
                <MailIcon className="h-5 w-5" />
              </span>
              <input
                type="email"
                placeholder="Email Address (Gmail or Outlook only)"
                value={Email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 placeholder:text-zinc-500 text-white h-12 rounded-xl pl-12 pr-4 outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white/[0.08]"
              />
            </div>

            <div className="relative flex flex-col justify-center">
              <span className="absolute left-4 text-zinc-400">
                <LockIcon className="h-5 w-5" />
              </span>
              <input
                type="password"
                placeholder="Password"
                value={Password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 placeholder:text-zinc-500 text-white h-12 rounded-xl pl-12 pr-4 outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white/[0.08]"
              />
            </div>

            <button type="submit" className="w-full bg-purple-600 text-white font-medium h-12 rounded-xl mt-2 shadow-lg shadow-purple-600/20 hover:bg-purple-700 active:scale-[0.98] transition-all duration-200 cursor-pointer">
              Create Account
            </button>

            <div className="text-center text-sm text-zinc-400 mt-4">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-purple-400 font-medium hover:text-purple-300 hover:underline transition-colors"
              >
                Login
              </Link>
            </div>
            
            {message && (
              <p className={`text-center text-sm font-medium mt-3 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;