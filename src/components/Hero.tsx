"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

function dispatchToggle(mode?: string | null) {
  window.dispatchEvent(new CustomEvent("toggleAuth", { detail: mode ?? null }));
}

export default function Hero() {
  const router = useRouter();

  async function handleStart() {
    try {
      const { data } = await supabase!.auth.getSession();
      const user = data.session?.user ?? null;
      if (!user) {
        // open signup/login overlay
        dispatchToggle("signup");
        return;
      }
      // If signed in, open the setup modal on the homepage (stay on home).
      window.dispatchEvent(new CustomEvent("openSetupModal"));
    } catch (err) {
      console.error("Error checking session before starting interview", err);
      dispatchToggle("signup");
    }
  }

  async function handleViewBank() {
    try {
      const { data } = await supabase!.auth.getSession();
      const user = data.session?.user ?? null;
      if (!user) {
        dispatchToggle("login");
        return;
      }
      router.push("/question-bank");
    } catch (err) {
      console.error("Error checking session before viewing question bank", err);
      dispatchToggle("login");
    }
  }

  return (
    <div className="text-center mb-24">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold mb-6">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        POWERED BY AGENTIC INTELLIGENCE
      </div>

      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
        Master the SDE Interview <br />with an AI Agent.
      </h1>

      <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
        Speak your logic, code in C++, and engage with an interviewer that uses real past-year questions from top tech firms.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button onClick={handleStart} className="glow-button bg-blue-600 px-8 py-4 rounded-xl text-lg font-bold">Start Mock Interview</button>
        <button onClick={handleViewBank} className="bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-xl text-lg font-bold transition">View Question Bank</button>
      </div>
    </div>
  );
}
