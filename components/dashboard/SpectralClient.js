"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import SpectralChart from "./SpectralChart";

// ── Channel definitions ──────────────────────────────────────────────────
const CHANNELS = [
  { key: "violet_415", label: "Violet", nm: "415nm", color: "#8b5cf6" },
  { key: "indigo_445", label: "Indigo", nm: "445nm", color: "#6366f1" },
  { key: "blue_480",   label: "Blue",   nm: "480nm", color: "#3b82f6" },
  { key: "cyan_515",   label: "Cyan",   nm: "515nm", color: "#06b6d4" },
  { key: "green_555",  label: "Green",  nm: "555nm", color: "#22c55e" },
  { key: "yellow_590", label: "Yellow", nm: "590nm", color: "#eab308" },
  { key: "orange_630", label: "Orange", nm: "630nm", color: "#f97316" },
  { key: "red_680",    label: "Red",    nm: "680nm", color: "#ef4444" },
  { key: "clear_channel", label: "Clear", nm: "Clear", color: "#d1d5db" },
  { key: "nir_channel",   label: "NIR",   nm: "NIR",   color: "#a855f7" },
];

const VISIBLE_CHANNELS = CHANNELS.filter(c => c.key !== "clear_channel");

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
    const vals = CHANNELS.filter(c => c.key !== "clear_channel")
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
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#8b5cf6"}}>{Number(row.violet_415||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#6366f1"}}>{Number(row.indigo_445||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#3b82f6"}}>{Number(row.blue_480||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#06b6d4"}}>{Number(row.cyan_515||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#22c55e"}}>{Number(row.green_555||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#eab308"}}>{Number(row.yellow_590||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#f97316"}}>{Number(row.orange_630||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#ef4444"}}>{Number(row.red_680||0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{color:"#a855f7"}}>{Number(row.nir_channel||0).toFixed(0)}</td>
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
