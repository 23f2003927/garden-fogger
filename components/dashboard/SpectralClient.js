"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import SpectralChart from "./SpectralChart";
import { analyzeLeafData } from "@/lib/leaf-analysis";

// ── Channel definitions ──────────────────────────────────────────────────
const CHANNELS = [
  { key: "f1_415nm", label: "Violet", nm: "415nm", color: "#8b5cf6" },
  { key: "f2_445nm", label: "Indigo", nm: "445nm", color: "#6366f1" },
  { key: "f3_480nm", label: "Blue",   nm: "480nm", color: "#3b82f6" },
  { key: "f4_515nm", label: "Cyan",   nm: "515nm", color: "#06b6d4" },
  { key: "f5_555nm", label: "Green",  nm: "555nm", color: "#22c55e" },
  { key: "f6_590nm", label: "Yellow", nm: "590nm", color: "#eab308" },
  { key: "f7_630nm", label: "Orange", nm: "630nm", color: "#f97316" },
  { key: "f8_680nm", label: "Red",    nm: "680nm", color: "#ef4444" },
  { key: "clear",    label: "Clear", nm: "Clear", color: "#d1d5db" },
  { key: "nir",      label: "NIR",   nm: "NIR",   color: "#a855f7" },
];

const VISIBLE_CHANNELS = CHANNELS.filter(c => c.key !== "clear");

// ── AI Placeholders ──────────────────────────────────────────────────────
const AI_FEATURES = [
  { icon: "🌿", title: "Plant Health Score" },
  { icon: "⚠️", title: "Stress Detection" },
  { icon: "🦠", title: "Disease Risk" },
  { icon: "🧪", title: "Nutrient Deficiency Risk" },
  { icon: "📋", title: "Crop Recommendation" },
];

function formatTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString([], {
    month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function isRecent(dateStr, thresholdMs = 120_000) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() <= thresholdMs;
}

// ══════════════════════════════════════════════════════════════════════════
export default function SpectralClient({ initialReading, initialHistory }) {
  const supabase = useMemo(() => createClient(), []);

  const [latest, setLatest] = useState(initialReading);
  const [history, setHistory] = useState(initialHistory ?? []);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [leafAnalysis, setLeafAnalysis] = useState({
    isLeaf: false,
    status: "Waiting for Analysis",
    score: 0,
    ndvi: 0,
    chlorophyllIndex: 0,
    simpleRatio: 0,
    message: "Place the sensor flat on a leaf, then click the 'Analyze Current Leaf' button to scan."
  });

  const analyzeCurrentLeaf = useCallback(() => {
    setLeafAnalysis(analyzeLeafData(latest));
  }, [latest]);

  // ── Supabase Realtime subscription ──────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("spectral-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "spectral_readings" },
        (payload) => {
          const row = payload.new;
          setLatest(row);
          setHistory((prev) => [...prev.slice(-99), row]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // ── Polling fallback every 15s ──────────────────────────────────────
  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("spectral_readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setLatest((prev) => {
        if (prev && prev.id === data.id) return prev;
        setHistory((h) => {
          if (h.length > 0 && h[h.length - 1].id === data.id) return h;
          return [...h.slice(-99), data];
        });
        return data;
      });
    }
  }, [supabase]);

  useEffect(() => {
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  // ── Filter history by date range ────────────────────────────────────
  const fetchFiltered = useCallback(async () => {
    let query = supabase
      .from("spectral_readings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);
    if (startDate) query = query.gte("created_at", new Date(startDate).toISOString());
    if (endDate) query = query.lte("created_at", new Date(endDate + "T23:59:59").toISOString());
    const { data } = await query;
    if (data) setHistory(data);
  }, [supabase, startDate, endDate]);

  // ── Sensor insights ─────────────────────────────────────────────────
  const insights = useMemo(() => {
    if (!latest) return null;
    const vals = CHANNELS.filter(c => c.key !== "clear")
      .map(c => ({ ...c, val: Number(latest[c.key]) || 0 }));
    const sorted = [...vals].sort((a, b) => b.val - a.val);
    const avg = vals.reduce((s, v) => s + v.val, 0) / vals.length;
    return {
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
      avg: avg.toFixed(1),
      quality: vals.every(v => v.val > 0) ? "Good" : "Partial",
    };
  }, [latest]);

  const online = isRecent(latest?.created_at);

  return (
    <div className="spectral-page">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="spectral-header">
        <h1 className="spectral-title">Spectral Analysis</h1>
        <p className="spectral-subtitle">
          Adafruit AS7341 · 10-Channel Spectral Sensor · Real-Time
        </p>
      </div>

      {/* ── Sensor Status Bar ──────────────────────────────────────── */}
      <div className="sensor-status-bar">
        <div className="status-item">
          <span className={`status-dot ${online ? "status-dot-online" : "status-dot-offline"}`} />
          <span className="status-label">Status:</span>
          <span className="status-value">{online ? "Online" : "Offline"}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Node:</span>
          <span className="status-value">{latest?.node_id ?? "—"}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Last Update:</span>
          <span className="status-value">{formatTime(latest?.created_at)}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Connection:</span>
          <span className="status-value">{online ? "Real-Time" : "Waiting"}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Frequency:</span>
          <span className="status-value">~15s</span>
        </div>
      </div>

      {/* ── Channel Cards ──────────────────────────────────────────── */}
      <h2 className="text-gray-900 font-semibold text-base mb-3">
        Real-Time Spectral Channels
      </h2>
      <div className="spectral-channels-grid">
        {CHANNELS.map((ch) => {
          const val = latest ? Number(latest[ch.key]) : null;
          return (
            <div className="channel-card" key={ch.key}>
              <div className="channel-label">{ch.label}</div>
              <div className="channel-wavelength">{ch.nm}</div>
              <div className="channel-value" style={{ color: ch.color }}>
                <span className="channel-dot" style={{ background: ch.color }} />
                {val !== null && !isNaN(val) ? val.toFixed(0) : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Spectrum Chart ─────────────────────────────────────────── */}
      <div className="spectrum-chart-wrap">
        <h2 className="spectrum-chart-title">Live Spectrum Graph</h2>
        <p className="spectrum-chart-sub">Intensity vs Wavelength — updated in real-time</p>
        <SpectralChart latest={latest} channels={VISIBLE_CHANNELS} />
      </div>

      {/* ── Live Leaf Health Analysis ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gray-900 font-semibold text-base">
          Leaf Health Analysis
        </h2>
        <button 
          onClick={analyzeCurrentLeaf}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          Analyze Current Leaf
        </button>
      </div>
      <div className="leaf-health-wrap">
        <div className="leaf-health-grid">
          {/* Gauge Column */}
          <div className="leaf-health-score-container">
            {(() => {
              const colors = {
                "Green Leaf Found": { border: "#22c55e", bg: "#22c55e" },
                "Stressed Leaf Found": { border: "#eab308", bg: "#eab308" },
                "Dead Leaf Detected": { border: "#b45309", bg: "#b45309" },
                "Not a Leaf": { border: "#6b7280", bg: "#6b7280" },
                "No Leaf Detected": { border: "#d1d5db", bg: "#9ca3af" },
                "Waiting for Analysis": { border: "#94a3b8", bg: "#94a3b8" }
              };
              
              const activeColor = colors[leafAnalysis.status] || colors["Unknown"];
              const progressPct = `${leafAnalysis.score}%`;
              
              return (
                <>
                  <div 
                    className="leaf-health-gauge" 
                    style={{ 
                      "--progress-color": activeColor.border,
                      "--progress-pct": progressPct
                    }}
                  >
                    <span className="leaf-health-score-num">
                      {leafAnalysis.isLeaf ? leafAnalysis.score : "—"}
                    </span>
                  </div>
                  <span 
                    className="leaf-health-status-badge"
                    style={{ "--status-color": activeColor.bg }}
                  >
                    {leafAnalysis.status}
                  </span>
                </>
              );
            })()}
          </div>

          {/* Details Column */}
          <div className="leaf-health-details">
            <div className="leaf-health-message">
              {leafAnalysis.message}
            </div>

            <div className="leaf-health-metrics">
              <div className="leaf-health-metric-card">
                <div className="leaf-health-metric-label">NDVI</div>
                <div className="leaf-health-metric-val">
                  {leafAnalysis.isLeaf ? leafAnalysis.ndvi : "—"}
                </div>
                <div className="leaf-health-metric-sub">Range: 0.35 - 0.85</div>
              </div>

              <div className="leaf-health-metric-card">
                <div className="leaf-health-metric-label">Chlorophyll Index</div>
                <div className="leaf-health-metric-val">
                  {leafAnalysis.isLeaf ? leafAnalysis.chlorophyllIndex : "—"}
                </div>
                <div className="leaf-health-metric-sub">Reflectance Ratio</div>
              </div>

              <div className="leaf-health-metric-card">
                <div className="leaf-health-metric-label">NIR/Red Ratio</div>
                <div className="leaf-health-metric-val">
                  {leafAnalysis.isLeaf ? leafAnalysis.simpleRatio : "—"}
                </div>
                <div className="leaf-health-metric-sub">Target: &gt;1.25</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sensor Insights ────────────────────────────────────────── */}
      <h2 className="text-gray-900 font-semibold text-base mb-3">
        Sensor Insights
      </h2>
      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-label">Highest Channel</div>
          <div className="insight-value" style={{ color: insights?.highest?.color }}>
            {insights?.highest?.label ?? "—"}
          </div>
          <div className="insight-sub">{insights?.highest?.nm}</div>
        </div>
        <div className="insight-card">
          <div className="insight-label">Lowest Channel</div>
          <div className="insight-value" style={{ color: insights?.lowest?.color }}>
            {insights?.lowest?.label ?? "—"}
          </div>
          <div className="insight-sub">{insights?.lowest?.nm}</div>
        </div>
        <div className="insight-card">
          <div className="insight-label">Average Intensity</div>
          <div className="insight-value">{insights?.avg ?? "—"}</div>
        </div>
        <div className="insight-card">
          <div className="insight-label">Last Reading</div>
          <div className="insight-value" style={{ fontSize: 14 }}>
            {formatTime(latest?.created_at)}
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-label">Data Quality</div>
          <div className="insight-value" style={{ color: insights?.quality === "Good" ? "#4ade80" : "#f59e0b" }}>
            {insights?.quality ?? "—"}
          </div>
        </div>
      </div>

      {/* ── Historical Analysis ────────────────────────────────────── */}
      <div className="history-section">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-gray-900 font-semibold text-base">
            Historical Analysis
          </h2>
          <span className="text-gray-500 text-xs font-mono">
            {history.length} readings
          </span>
        </div>
        <div className="history-controls">
          <label className="text-gray-500 text-xs">From:</label>
          <input
            type="date"
            className="history-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label className="text-gray-500 text-xs">To:</label>
          <input
            type="date"
            className="history-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button onClick={fetchFiltered} className="btn-primary text-sm">
            Filter
          </button>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Time</th>
                  <th className="px-3 py-2 text-right font-medium">V</th>
                  <th className="px-3 py-2 text-right font-medium">I</th>
                  <th className="px-3 py-2 text-right font-medium">B</th>
                  <th className="px-3 py-2 text-right font-medium">C</th>
                  <th className="px-3 py-2 text-right font-medium">G</th>
                  <th className="px-3 py-2 text-right font-medium">Y</th>
                  <th className="px-3 py-2 text-right font-medium">O</th>
                  <th className="px-3 py-2 text-right font-medium">R</th>
                  <th className="px-3 py-2 text-right font-medium">NIR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...history].reverse().slice(0, 100).map((row) => (
                  <tr key={row.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 font-mono text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#8b5cf6"}}>{Number(row.f1_415nm||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#6366f1"}}>{Number(row.f2_445nm||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#3b82f6"}}>{Number(row.f3_480nm||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#06b6d4"}}>{Number(row.f4_515nm||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#22c55e"}}>{Number(row.f5_555nm||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#eab308"}}>{Number(row.f6_590nm||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#f97316"}}>{Number(row.f7_630nm||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#ef4444"}}>{Number(row.f8_680nm||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#a855f7"}}>{Number(row.nir||0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No spectral readings found. Waiting for sensor data…
          </div>
        )}
      </div>

      {/* ── AI Placeholders ────────────────────────────────────────── */}
      <h2 className="text-gray-900 font-semibold text-base mb-3">
        Crop Intelligence — Future Capabilities
      </h2>
      <div className="ai-placeholders-grid">
        {AI_FEATURES.map((f) => (
          <div className="ai-placeholder-card" key={f.title}>
            <div className="ai-placeholder-icon">{f.icon}</div>
            <div className="ai-placeholder-title">{f.title}</div>
            <span className="ai-placeholder-badge">Coming Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
