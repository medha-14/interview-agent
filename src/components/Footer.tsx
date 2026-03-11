"use client";

import React from "react";
import MessageForm from "./MessageForm";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-white/5">

      <div className="py-20">

        {/* Top Heading */}
        <div className="mb-16 text-center">
          <h2 className="text-white font-bold text-3xl mb-6 tracking-tight">
            Prepare for Interviews at Top Tech Companies
          </h2>
        </div>

        {/* Company Logo Slider */}
        <div className="mb-24 flex justify-center">
          <div className="slider">
            <div className="slide-track">

              <div className="slide">
                <img src="https://static.vecteezy.com/system/resources/thumbnails/022/613/027/small/google-icon-logo-symbol-free-png.png" height="100" width="100" alt="Google" />
              </div>

              <div className="slide">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" height="140" width="140" alt="Amazon" />
              </div>

              <div className="slide">
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" height="80" width="80" alt="Apple" />
              </div>

              <div className="slide">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" height="80" width="80" alt="Meta" />
              </div>

              <div className="slide">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/7a/Logonetflix.png" height="110" width="110" alt="Netflix" />
              </div>

              <div className="slide">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" height="80" width="80" alt="Microsoft" />
              </div>

              <div className="slide">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" height="120" width="120" alt="Uber" />
              </div>

            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="flex justify-center">
          <div className="text-center max-w-xl w-full">

          <h3 className="text-white font-bold text-3xl mb-3 tracking-tight">Let&apos;s Connect</h3>

            <p className="text-slate-400 text-sm mb-8">
              Have questions about interview preparation? Send us a message.
            </p>

            <MessageForm />

          </div>
        </div>

      </div>

      {/* Thin Footer */}
      <div className="border-t border-white/5 py-4 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Interview Agent 
      </div>

    </footer>
  );
}