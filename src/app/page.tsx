"use client";

import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Preview from "../components/Preview";
import Footer from "../components/Footer";
import AuthOverlay from "../components/AuthOverlay";
import SetupModal from "../components/SetupModal";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    function onOpen() {
      setModalOpen(true);
    }
    window.addEventListener("openSetupModal", onOpen as EventListener);
    return () => window.removeEventListener("openSetupModal", onOpen as EventListener);
  }, []);

  function handleStart(opts: { company: string; topic: string; duration: number }) {
    // navigate to dashboard with params so the dashboard can start the session
    const q = new URLSearchParams();
    q.set("company", opts.company);
    q.set("topic", opts.topic);
    q.set("duration", String(opts.duration));
    router.push(`/dashboard?${q.toString()}`);
  }

  return (
    <>
      <Nav />
      <main id="landing-page" className="relative pt-32">
        <div className="hero-gradient absolute inset-0 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <section className="text-center mb-24">
            <Hero />
          </section>

          <section>
            <Features />
          </section>

          <section>
            <Preview />
          </section>

          <section>
            <Footer />
          </section>
        </div>
      </main>
      <AuthOverlay />
      <SetupModal open={modalOpen} onClose={() => setModalOpen(false)} onStart={handleStart} />
    </>
  );
}

