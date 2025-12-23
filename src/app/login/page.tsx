"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

// Login page component: supports email/password auth and OAuth (Google/GitHub).
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase!.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    }

    loadSession();

    const { data: listener } = supabase!.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase!.auth.signUp({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("Check your email for a confirmation link (if enabled).");
  };

  const handleSignIn = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("Signed in successfully.");
  };

  const handleSignOut = async () => {
    await supabase!.auth.signOut();
    setMessage("Signed out.");
  };

  // OAuth sign-in. Passing an explicit `redirectTo` (current origin) helps avoid
  // redirect_mismatch issues when developing on localhost.
  const handleOAuthSignIn = async (provider: "github" | "google") => {
    setLoading(true);
    setMessage("");
    try {
      const redirectTo =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const { error } = await supabase!.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) setMessage(error.message);
    } catch (err: any) {
      setMessage(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
    // On success the browser is redirected to the provider and back to the app.
  };

  return (
    <div style={{ maxWidth: 720, margin: "48px auto", padding: 20 }}>
      <h1 style={{ marginBottom: 12 }}>Practice — Sign in / Sign up</h1>

      {user ? (
        <div>
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>
          <button onClick={handleSignOut}>Sign out</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading}
            >
              Continue with GitHub
            </button>
            <button
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
            >
              Continue with Google
            </button>
          </div>

          <div style={{ textAlign: "center", color: "#666", margin: "8px 0" }}>
            or
          </div>

          <label style={{ display: "flex", flexDirection: "column" }}>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              style={{ padding: 8, fontSize: 14 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column" }}>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              style={{ padding: 8, fontSize: 14 }}
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSignIn} disabled={loading}>
              Sign in
            </button>
            <button onClick={handleSignUp} disabled={loading}>
              Sign up
            </button>
          </div>
          {message && <p style={{ marginTop: 8 }}>{message}</p>}
        </div>
      )}
    </div>
  );
}
