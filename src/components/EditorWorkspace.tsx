"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const ACTIVE_SESSION_STORAGE_KEY = "interview_agent_active_session_v1";

function createUuidFallback() {
  // Not cryptographically strong; only used if crypto.randomUUID is unavailable.
  return `id_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

function getOrCreateStableSessionId(company: string, topic: string, duration: number) {
  if (typeof window === "undefined") return createUuidFallback();

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as any;
      const isFresh = typeof parsed?.ts === "number" && Date.now() - parsed.ts < 10_000;
      const matches = parsed?.company === company && parsed?.topic === topic && parsed?.duration === duration;
      if (isFresh && matches && typeof parsed?.id === "string" && parsed.id.length > 0) {
        return parsed.id as string;
      }
    }
  } catch {
    // ignore
  }

  const id = (globalThis as any)?.crypto?.randomUUID?.() ?? createUuidFallback();
  try {
    window.sessionStorage.setItem(
      ACTIVE_SESSION_STORAGE_KEY,
      JSON.stringify({ id, company, topic, duration, ts: Date.now() })
    );
  } catch {
    // ignore
  }
  return id as string;
}

type Props = {
  company: string;
  topic: string;
  duration: number;
  onEnd?: () => void;
};

export default function EditorWorkspace({ company, topic, duration, onEnd }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [agentText, setAgentText] = useState("\"Connecting to session...\"");
  const [listening, setListening] = useState(true);
  const [editorValue, setEditorValue] = useState(`// Implement your solution here\n`);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(duration * 60);
  const sessionIdRef = useRef<string | null>(null);
  const startedAtMsRef = useRef<number>(Date.now());
  const endedRef = useRef(false);

  useEffect(() => {
    setAgentText(`"Welcome. I've pulled a question from ${company}'s bank for ${topic}. Before coding, explain your approach to the agent."`);
  }, [company, topic]);

  // Create a session record when the interview starts.
  useEffect(() => {
    let cancelled = false;
    endedRef.current = false;
    sessionIdRef.current = null;
    startedAtMsRef.current = Date.now();

    async function createSessionRow() {
      try {
        if (!supabase) return;

        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!userRes.user) return;

        const stableId = getOrCreateStableSessionId(company, topic, duration);
        const startedAtIso = new Date().toISOString();
        sessionIdRef.current = stableId;

        const { data, error } = await supabase
          .from("interview_sessions")
          .upsert(
            {
              id: stableId,
              company,
              topic,
              duration_minutes: duration,
              started_at: startedAtIso,
              ended_at: null,
              elapsed_seconds: 0,
              agent_score: 8,
            },
            { onConflict: "id" }
          )
          .select("id")
          .single();

        if (error) throw error;
        if (!cancelled) sessionIdRef.current = (data as any)?.id ?? stableId;
      } catch (e) {
        console.warn("Failed to create interview session row", e);
      }
    }

    createSessionRow();

    return () => {
      cancelled = true;
      // Best-effort save on unmount. Avoid ending instantly (StrictMode dev remounts).
      void finishSessionRow({ force: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, topic, duration]);

  useEffect(() => {
    const t = setInterval(() => setTimerSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Ensure timer is set to the chosen interview duration when the component mounts
  // or when the duration prop changes. This guarantees the countdown begins
  // immediately for the full interview time chosen in the SetupModal.
  useEffect(() => {
    setTimerSeconds(duration * 60);
  }, [duration]);

  async function finishSessionRow(opts?: { force?: boolean }) {
    try {
      if (endedRef.current) return;
      if (!supabase) return;
      const id = sessionIdRef.current;
      if (!id) return;

      const elapsed = Math.min(
        duration * 60,
        Math.max(0, Math.floor((Date.now() - startedAtMsRef.current) / 1000))
      );

      // React StrictMode (dev) mounts/unmounts immediately which would otherwise
      // mark a session ended with 0s elapsed. Skip ultra-fast unmounts.
      if (!opts?.force && elapsed < 3) return;

      endedRef.current = true;

      await supabase
        .from("interview_sessions")
        .update({
          ended_at: new Date().toISOString(),
          elapsed_seconds: elapsed,
          agent_score: 8,
        })
        .eq("id", id);

      try {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        }
      } catch {
        // ignore
      }
    } catch (e) {
      console.warn("Failed to finish interview session row", e);
    }
  }

  async function handleEndSession() {
    await finishSessionRow({ force: true });
    onEnd?.();
  }

  function simulateUnlock() {
    setAgentText("Analyzing approach... Logic seems sound. Unlocking editor.");
    setListening(false);
    setTimeout(() => {
      setUnlocked(true);
      setAgentText(`Editor unlocked. You have ${duration} minutes to implement the solution.`);
      editorRef.current?.focus();
    }, 1200);
  }

  function formatTimer() {
    const hrs = Math.floor(timerSeconds / 3600);
    const mins = Math.floor((timerSeconds % 3600) / 60);
    const secs = timerSeconds % 60;
    return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  }

  return (
    <div className="h-screen flex overflow-hidden relative">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
          <div className={`w-2 h-2 rounded-full ${listening ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
          <span className="text-xs font-mono text-slate-300">{formatTimer()}</span>
        </div>
        <button
          className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-500/20 transition"
          onClick={handleEndSession}
        >
          End Session
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[35%] flex flex-col border-r border-white/5 bg-slate-900/30">
          <div className="h-64 border-b border-white/5 p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
                <span className="text-xs font-bold text-blue-400 tracking-wider">AI AGENT ACTIVE</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">STATUS: {listening ? 'LISTENING' : 'READY'}</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div id="voice-viz" className={`flex items-center gap-1 h-12 mb-4 ${listening ? 'speaking' : ''}`}>
                <div className="wave-bar" style={{animationDelay: '0.0s'}}></div>
                <div className="wave-bar" style={{animationDelay: '0.1s'}}></div>
                <div className="wave-bar" style={{animationDelay: '0.2s'}}></div>
                <div className="wave-bar" style={{animationDelay: '0.3s'}}></div>
                <div className="wave-bar" style={{animationDelay: '0.1s'}}></div>
              </div>
              <p id="agent-text" className="text-center text-sm text-slate-200 font-medium leading-relaxed">{agentText}</p>
            </div>

            <div className="mt-4 flex gap-2 justify-center">
              <button id="mic-btn" className={`w-10 h-10 rounded-full ${listening ? 'bg-blue-600' : 'bg-slate-700'} hover:bg-blue-500 flex items-center justify-center transition shadow-lg shadow-blue-500/20`} onClick={() => setListening((s) => !s)}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              </button>
              <button onClick={simulateUnlock} className="px-4 py-2 rounded-full border border-white/10 text-xs font-semibold hover:bg-white/5 transition">I'm Ready to Code</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="mb-4">
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">Easy</span>
              <span className="text-xs font-bold text-slate-400 ml-2">{topic}</span>
            </div>
            <h2 className="text-xl font-bold mb-4">Valid Palindrome</h2>
            <div className="prose prose-invert prose-sm text-slate-300">
              <p>A phrase is a <strong>palindrome</strong> if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.</p>
              <p>Alphanumeric characters include letters and numbers.</p>
              <p>Given a string <code>s</code>, return <code>true</code> if it is a palindrome, or <code>false</code> otherwise.</p>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5 my-4">
                <p className="font-mono text-xs text-slate-400 mb-1">Example 1:</p>
                <p className="font-mono text-sm mb-2">Input: s = "A man, a plan, a canal: Panama"</p>
                <p className="font-mono text-sm">Output: true</p>
              </div>

              <p><strong>Constraints:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li><code>{'1 <= s.length <= 2 * 10^5'}</code></li>
                <li><code>s</code> consists only of printable ASCII characters.</li>
              </ul>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-[#1e1e1e] relative">
          <div className="h-10 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between pl-4 pr-64 select-none">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white">solution.cpp</div>
            </div>
            <div className="flex items-center gap-2">
               <select className="bg-transparent text-xs text-slate-400 focus:outline-none border-none cursor-pointer">
                  <option>C++ 17</option>
                  <option>C++ 20</option>
                  <option>Java</option>
                  <option>Python 3</option>
              </select>
            </div>
          </div>

          <div className="flex-1 relative" style={{ minHeight: 0 }}>
            <textarea ref={editorRef} value={editorValue} onChange={(e) => setEditorValue(e.target.value)} className={`absolute inset-0 w-full h-full bg-[#1e1e1e] text-white font-mono p-6 resize-none ${unlocked ? '' : 'opacity-60 pointer-events-none'}`} />

            <div className={`logic-lock-overlay ${unlocked ? 'hidden' : ''}`}>
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Editor Locked</h3>
              <p className="text-sm text-slate-400 max-w-xs text-center">Please explain your approach to the AI Agent to unlock the coding environment.</p>
            </div>
          </div>

          <div className="h-12 bg-[#1e1e1e] border-t border-[#333] flex items-center justify-between px-4 shrink-0">
            <button className="text-xs text-slate-400 hover:text-white flex items-center gap-2">Console</button>
            <div className="flex items-center gap-3">
              <button className="px-4 py-1.5 rounded text-xs font-semibold text-slate-300 hover:bg-white/5 border border-transparent transition">Run Code</button>
              <button className="px-4 py-1.5 rounded text-xs font-semibold bg-green-600 text-white hover:bg-green-500 transition shadow-lg shadow-green-500/10">Submit</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
