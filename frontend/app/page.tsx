"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./landing.css";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // smooth fade-in
    setMounted(true);
  }, []);

  return (
    <div className={`landing-container ${mounted ? "loaded" : ""}`}>
      {/* Background Video */}
      <video
        className="landing-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>

      {/* Overlay & Glow */}
      <div className="overlay" />

      {/* Content */}
      <div className="content">
        <h1 className="title">BagBot 2.0</h1>
        <p className="subtitle">Quantum Trading Intelligence System</p>

        <Link href="/dashboard">
          <button className="start-btn">Enter Dashboard →</button>
        </Link>
      </div>

      {/* Side Badge */}
      <div className="badge">🛡️ Threat Center</div>
    </div>
  );
}
