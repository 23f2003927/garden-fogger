"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

/* ───────────────────────────── tiny helpers ───────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeIn({ children, className = "", delay = 0 }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={`fade-in-section ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   ══════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section id="hero" className="hero-section">
      <div className="hero-bg-pattern" />
      <div className="container" style={{ textAlign: "center", maxWidth: 820, paddingTop: 40, paddingBottom: 20 }}>
        <span className="hero-badge">🌱 Precision Agriculture Platform</span>
        <h1 className="hero-headline">
          Smarter Polyhouse Farming,
          Powered by Real-Time Data
        </h1>
        <p className="hero-sub" style={{ maxWidth: 600, margin: "0 auto" }}>
          Monitor crop health with spectral sensing and environmental data.
          Detect stress early, take action before yield is lost.
        </p>
        <div className="hero-buttons" style={{ justifyContent: "center" }}>
          <Link href="/dashboard" className="btn btn-primary-home" id="hero-view-dashboard">
            View Live Dashboard
          </Link>
          <a href="#technology" className="btn btn-outline" id="hero-explore-tech">
            Explore Technology
          </a>
        </div>

        {/* Live stats strip */}
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 32,
          marginTop: 48, padding: "20px 0",
          borderTop: "1px solid rgba(0,0,0,0.06)"
        }}>
          {[
            ["10", "Spectral Channels"],
            ["Real-Time", "Data Streaming"],
            ["415–910nm", "Wavelength Range"],
            ["< 15s", "Refresh Rate"],
          ].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--gray-900)" }}>{val}</div>
              <div style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 2 — THE PROBLEM
   ══════════════════════════════════════════════════════════════════════════ */
const PROBLEMS = [
  {
    icon: "⏳",
    title: "Late Crop Stress Detection",
    desc: "Problems become visible only after damage begins — by then, yield loss is already underway.",
  },
  {
    icon: "👷",
    title: "Labour Intensive Monitoring",
    desc: "Farmers cannot manually inspect every plant consistently across large polyhouse operations.",
  },
  {
    icon: "🩺",
    title: "Limited Agronomist Access",
    desc: "Expert guidance is often expensive, unavailable in rural areas, or arrives too late.",
  },
  {
    icon: "🔥",
    title: "Reactive Decisions",
    desc: "Actions are taken after losses have already started, instead of preventing them.",
  },
];

function ProblemSection() {
  return (
    <section id="problem" className="section section-alt">
      <div className="container">
        <FadeIn>
          <div className="section-header">
            <span className="section-badge">The Challenge</span>
            <h2 className="section-title">Agriculture Still Relies on Manual Monitoring</h2>
            <p className="section-subtitle">
              Across India's polyhouse farming sector, critical crop management decisions are
              delayed because growers lack affordable, continuous monitoring tools.
            </p>
          </div>
        </FadeIn>

        <div className="problem-grid">
          {PROBLEMS.map((p, i) => (
            <FadeIn key={p.title} delay={i * 100}>
              <div className="problem-card">
                <span className="problem-icon">{p.icon}</span>
                <h3 className="problem-title">{p.title}</h3>
                <p className="problem-desc">{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 3 — OUR SOLUTION
   ══════════════════════════════════════════════════════════════════════════ */
const STEPS = [
  {
    num: "01",
    title: "Scan Plant",
    desc: "Use a handheld spectral sensor to capture reflected light signatures from crop leaves.",
    icon: "📡",
  },
  {
    num: "02",
    title: "Analyze Crop Health",
    desc: "Process spectral and environmental data to identify abnormal stress patterns before visible symptoms.",
    icon: "📊",
  },
  {
    num: "03",
    title: "Take Action",
    desc: "Receive actionable recommendations and alerts before problems become severe.",
    icon: "✅",
  },
];

function SolutionSection() {
  return (
    <section id="solution" className="section">
      <div className="container">
        <FadeIn>
          <div className="section-header">
            <span className="section-badge">Our Approach</span>
            <h2 className="section-title">Introducing SmartFarm</h2>
            <p className="section-subtitle">
              A comprehensive hardware and software workflow that transforms how polyhouse farmers monitor and manage
              crop health — from reactive guesswork to proactive intelligence.
            </p>
          </div>
        </FadeIn>

        <div className="solution-layout-grid">
          {/* Left Column: Steps */}
          <div className="solution-steps-column">
            {STEPS.map((s, i) => (
              <FadeIn key={s.num} delay={i * 100}>
                <div className="solution-step-item">
                  <div className="step-num-badge">
                    <span className="step-num-text">{s.num}</span>
                  </div>
                  <div className="step-item-content">
                    <h3 className="step-item-title">{s.icon} {s.title}</h3>
                    <p className="step-item-desc">{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Right Column: Physical Device Image */}
          <FadeIn delay={200} className="solution-device-column">
            <div className="solution-device-card">
              <div className="device-img-wrap">
                <Image
                  src="/images/device.jpg"
                  alt="SmartFarm Handheld IoT Spectral Scanner Device with ESP32 and AS7341"
                  width={500}
                  height={320}
                  className="solution-device-img"
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <div className="device-card-content">
                <span className="device-badge">Hardware Prototype</span>
                <h4 className="device-title">SmartFarm Handheld IoT Spectral Scanner</h4>
                <p className="device-desc">
                  Custom-built handheld scanner integrating the Adafruit AS7341 spectral sensor and an ESP32 microcontroller with a built-in status display.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 4 — TECHNOLOGY
   ══════════════════════════════════════════════════════════════════════════ */
const TECH = [
  {
    icon: "🔬",
    title: "Adafruit AS7341 Spectral Sensor",
    desc: "10-channel visible + NIR spectral sensor capturing reflected light across 415–910 nm for plant analysis.",
  },
  {
    icon: "🌡️",
    title: "Environmental Monitoring",
    desc: "Continuous temperature and humidity tracking via distributed polyhouse sensor nodes.",
  },
  {
    icon: "⚡",
    title: "Real-Time Data Processing",
    desc: "ESP32 microcontrollers stream data to the cloud in real-time for instant analysis and visualization.",
  },
  {
    icon: "🧠",
    title: "Crop Intelligence Models",
    desc: "Spectral signatures are analyzed against crop-specific baselines to flag early stress indicators.",
  },
  {
    icon: "🤖",
    title: "Planned Automation Layer",
    desc: "Roadmap to automated actuator control — irrigation, fogging, and ventilation driven by real-time data.",
  },
];

function TechnologySection() {
  return (
    <section id="technology" className="section section-alt">
      <div className="container">
        <FadeIn>
          <div className="section-header">
            <span className="section-badge">Under the Hood</span>
            <h2 className="section-title">Built Around Plant Intelligence</h2>
            <p className="section-subtitle">
              SmartFarm analyzes how plants respond to their environment at the spectral level —
              instead of waiting for visible symptoms that are already too late.
            </p>
          </div>
        </FadeIn>

        <div className="tech-grid">
          {TECH.map((t, i) => (
            <FadeIn key={t.title} delay={i * 80}>
              <div className="tech-card">
                <span className="tech-icon">{t.icon}</span>
                <h3 className="tech-card-title">{t.title}</h3>
                <p className="tech-card-desc">{t.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 5 — LIVE PRODUCT PREVIEW
   ══════════════════════════════════════════════════════════════════════════ */
const PREVIEW_CARDS = [
  { icon: "🌡️", title: "Temperature", value: "Live", status: "active", color: "#f59e0b" },
  { icon: "💧", title: "Humidity", value: "Live", status: "active", color: "#06b6d4" },
  { icon: "🔬", title: "Spectral Analysis", value: "Live", status: "active", color: "#8b5cf6" },
  { icon: "🌿", title: "Plant Health Score", value: "—", status: "prototype", color: "#22c55e" },
  { icon: "⚠️", title: "Stress Detection", value: "—", status: "prototype", color: "#ef4444" },
  { icon: "🧠", title: "Crop Intelligence", value: "—", status: "prototype", color: "#3b82f6" },
];

function PreviewSection() {
  return (
    <section id="preview" className="section">
      <div className="container">
        <FadeIn>
          <div className="section-header">
            <span className="section-badge">Product Preview</span>
            <h2 className="section-title">What SmartFarm Delivers</h2>
            <p className="section-subtitle">
              Live environmental and spectral monitoring today — with a clear path toward
              full crop intelligence capabilities.
            </p>
          </div>
        </FadeIn>

        <div className="preview-grid">
          {PREVIEW_CARDS.map((c, i) => (
            <FadeIn key={c.title} delay={i * 80}>
              <div className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-icon">{c.icon}</span>
                  {c.status === "prototype" && (
                    <span className="preview-badge-soon">Coming Soon</span>
                  )}
                  {c.status === "active" && (
                    <span className="preview-badge-live">Live</span>
                  )}
                </div>
                <h3 className="preview-title">{c.title}</h3>
                <div className="preview-bar" style={{ background: c.color + "30" }}>
                  <div
                    className="preview-bar-fill"
                    style={{
                      background: c.color,
                      width: c.status === "active" ? "100%" : "25%",
                    }}
                  />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 6 — ROADMAP
   ══════════════════════════════════════════════════════════════════════════ */
const PHASES = [
  { num: 1, title: "Spectral Monitoring", desc: "Live sensor data capture, spectrum visualization, real-time dashboards.", status: "current" },
  { num: 2, title: "Plant Health Analytics", desc: "Baseline health indices, anomaly detection, historical trend analysis.", status: "next" },
  { num: 3, title: "Predictive Crop Intelligence", desc: "AI models predicting stress, disease risk, and nutrient deficiencies.", status: "planned" },
  { num: 4, title: "Automated Polyhouse Management", desc: "Closed-loop automation: irrigation, fogging, and ventilation driven by crop intelligence.", status: "planned" },
];

function RoadmapSection() {
  return (
    <section id="roadmap" className="section section-alt">
      <div className="container">
        <FadeIn>
          <div className="section-header">
            <span className="section-badge">Vision</span>
            <h2 className="section-title">From Monitoring to Autonomous Crop Intelligence</h2>
            <p className="section-subtitle">
              A phased roadmap from real-time sensor monitoring to fully automated polyhouse management.
            </p>
          </div>
        </FadeIn>

        <div className="roadmap-timeline">
          {PHASES.map((p, i) => (
            <FadeIn key={p.num} delay={i * 120}>
              <div className={`roadmap-item roadmap-${p.status}`}>
                <div className="roadmap-marker">
                  <span className="roadmap-dot" />
                  {i < PHASES.length - 1 && <span className="roadmap-line" />}
                </div>
                <div className="roadmap-content">
                  <span className="roadmap-phase">Phase {p.num}</span>
                  <h3 className="roadmap-title">{p.title}</h3>
                  <p className="roadmap-desc">{p.desc}</p>
                  {p.status === "current" && (
                    <span className="roadmap-badge-active">In Progress</span>
                  )}
                  {p.status === "next" && (
                    <span className="roadmap-badge-next">Up Next</span>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 7 — MISSION
   ══════════════════════════════════════════════════════════════════════════ */
function MissionSection() {
  return (
    <section id="mission" className="section">
      <div className="container">
        <FadeIn>
          <div className="mission-wrap">
            <h2 className="section-title" style={{ maxWidth: 700 }}>
              Building the Future of Precision Agriculture
            </h2>
            <p className="mission-text">
              SmartFarm is driven by a mission to make precision agriculture accessible,
              affordable, and actionable for every polyhouse farmer — not just large-scale
              commercial operations.
            </p>
            <div className="mission-pillars">
              {[
                ["🌿", "Sustainable Farming"],
                ["📡", "Sensor Technology"],
                ["🧠", "Data-Driven Agronomy"],
                ["🎯", "Precision Agriculture"],
                ["📈", "Data-Driven Decisions"],
              ].map(([icon, label]) => (
                <div className="mission-pillar" key={label}>
                  <span className="mission-pillar-icon">{icon}</span>
                  <span className="mission-pillar-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION 8 — FOOTER
   ══════════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-icon">🌱</span>
            <span className="footer-logo-text">SmartFarm</span>
          </div>
          <p className="footer-mission">
            Precision agronomic intelligence for polyhouse farmers. Combining spectral
            sensing, environmental monitoring, and crop health analytics.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Product</h4>
          <ul className="footer-links">
            <li><Link href="/dashboard">Live Dashboard</Link></li>
            <li><Link href="/dashboard/spectral">Spectral Analysis</Link></li>
            <li><a href="#technology">Technology</a></li>
            <li><a href="#roadmap">Roadmap</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Connect</h4>
          <ul className="footer-links">
            <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="mailto:contact@smartfarm.io">Contact Us</a></li>
            <li><span className="footer-placeholder">Partners — Coming Soon</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} SmartFarm. All rights reserved.</p>
        <p>Built with sensor technology, data science, and a passion for sustainable agriculture.</p>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NAVBAR
   ══════════════════════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`site-nav ${scrolled ? "nav-scrolled" : ""}`} id="main-nav">
      <div className="container nav-inner">
        <Link href="/" className="nav-brand">
          <span className="nav-logo-icon">🌱</span>
          <span className="nav-logo-text">SmartFarm</span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links-desktop">
          <a href="#problem" className="nav-link">Problem</a>
          <a href="#solution" className="nav-link">Solution</a>
          <Link href="/dashboard" className="nav-link">Live Dashboard</Link>
          <Link href="/dashboard/spectral" className="nav-link">Spectral Analysis</Link>
          <a href="#technology" className="nav-link">Technology</a>
          <a href="#roadmap" className="nav-link">Roadmap</a>
        </div>

        {/* Mobile toggle */}
        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`nav-hamburger ${menuOpen ? "open" : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="nav-mobile">
          <a href="#problem" className="nav-link" onClick={() => setMenuOpen(false)}>Problem</a>
          <a href="#solution" className="nav-link" onClick={() => setMenuOpen(false)}>Solution</a>
          <Link href="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Live Dashboard</Link>
          <Link href="/dashboard/spectral" className="nav-link" onClick={() => setMenuOpen(false)}>Spectral Analysis</Link>
          <a href="#technology" className="nav-link" onClick={() => setMenuOpen(false)}>Technology</a>
          <a href="#roadmap" className="nav-link" onClick={() => setMenuOpen(false)}>Roadmap</a>
        </div>
      )}
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <TechnologySection />
        <PreviewSection />
        <RoadmapSection />
        <MissionSection />
      </main>
      <Footer />
    </>
  );
}
