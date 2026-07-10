"use client";
import { LockIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Page = () => {
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [message, setmessage] = useState("");
  const [IsSucces, setIsSuccess] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 

    if (!Email || !Password) {
      setmessage("All fields are required");
      setIsSuccess(false);
      return; 
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: Email,
          password: Password,
        }),
      });

      if (res.ok) {
        setmessage("Logged in Successfully");
        setIsSuccess(true);

        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        
        const data = await res.json();
        setmessage(data.message || "Invalid Email or Password");
        setIsSuccess(false);
      }
    } catch (error) {
      setmessage("Something went wrong. Please try again!");
      setIsSuccess(false);
    }
  };

  return (
    <div className="flex h-[100svh] items-center justify-center bg-slate-950 px-4 py-12 selection:bg-purple-500 selection:text-white">
      {/* Main Login Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md shadow-2xl shadow-purple-950/20">
        <div className="flex flex-col items-center"> 
          {/* Header */}
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 select-none">
            Welcome Back
          </h1>
          <p className="text-sm text-zinc-400 mb-8">
            Please enter your details to sign in
          </p>

          <form className="w-full space-y-5" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="relative flex flex-col justify-center">
              <span className="absolute left-4 text-zinc-400">
                <MailIcon className="h-5 w-5" />
              </span>
              <input
                type="email"
                placeholder="Email Address"
                value={Email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 placeholder:text-zinc-500 text-white h-12 rounded-xl pl-12 pr-4 outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white/[0.08]"
              />
            </div>

            {/* Password Input */}
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

            {/* Submit Button */}
            <button type="submit" className="w-full bg-purple-600 text-white font-medium h-12 rounded-xl mt-2 shadow-lg shadow-purple-600/20 hover:bg-purple-700 active:scale-[0.98] transition-all duration-200 cursor-pointer">
              Login
            </button>

            {/* Footer Text */}
            <div className="text-center text-sm text-zinc-400 mt-4">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-purple-400 font-medium hover:text-purple-300 hover:underline transition-colors"
              >
                SignUp
              </Link>
            </div>

            {message && (
              <p className={`text-center text-sm font-medium mt-3 ${IsSucces ? "text-green-400" : "text-red-400"}`}>
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