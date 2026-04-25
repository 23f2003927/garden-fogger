"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import SensorCard from "./SensorCard";
import ControlCard from "./ControlCard";
import ThresholdCard from "./ThresholdCard";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: format a Date for "last updated" display
// ─────────────────────────────────────────────────────────────────────────────
function formatUpdatedAt(date) {
  if (!date) return null;
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function DashboardClient({ device, initialLog, initialSettings }) {
  // Create the Supabase client once — storing in a ref prevents a new client
  // being created on every render, which causes unnecessary re-renders / flicker.
  const supabase = useMemo(() => createClient(), []);
  const deviceId = device?.device_id ?? "garden_1";

  // ── Core sensor state ─────────────────────────────────────────────────────
  const [latestLog, setLatestLog] = useState(initialLog);
  const [settings, setSettings] = useState(initialSettings);
  const [controlLoading, setControlLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok"|"err", text }

  // ── Refresh UX state ──────────────────────────────────────────────────────
  // `isRefreshing` drives a subtle spinning dot — it does NOT unmount any card.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(
    initialLog ? new Date() : null
  );

  // ── Sensor history logs ───────────────────────────────────────────────────
  const [logs, setLogs] = useState([]);
  const [logMode, setLogMode] = useState("hour"); // "hour" | "all"
  // logsLoading is only true on the very FIRST fetch or when the user toggles
  // the mode. Background auto-refreshes never set this, so the table never
  // disappears during polling.
  const [logsLoading, setLogsLoading] = useState(false);

  // Store logMode in a ref so that fetchLogs / refreshData can always read the
  // latest value without being listed as dependencies. This prevents the
  // interval from being torn down and recreated every time the user switches
  // between "1 Hour" and "All Data".
  const logModeRef = useRef(logMode);
  useEffect(() => {
    logModeRef.current = logMode;
  }, [logMode]);

  // ─────────────────────────────────────────────────────────────────────────
  // fetchLogs — queries sensor_logs history
  //   showSpinner: true  → shows the loading placeholder (initial / toggle)
  //   showSpinner: false → silent background refresh, table stays visible
  // ─────────────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(
    async ({ showSpinner = false } = {}) => {
      if (showSpinner) setLogsLoading(true);

      const mode = logModeRef.current;

      // Query across all three ESP32 nodes (device_id A, B, C)
      let query = supabase
        .from("sensor_logs")
        .select("id, device_id, temperature, humidity, created_at")
        .in("device_id", ["A", "B", "C"])
        .order("created_at", { ascending: false });

      if (mode === "hour") {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", oneHourAgo);
      }

      const { data } = await query;

      // Only update state if we actually got rows back — never clear the
      // existing list on a temporary Supabase hiccup.
      if (data && data.length > 0) {
        setLogs(data);
      } else if (showSpinner) {
        // If spinner was shown (intentional fetch) and there's genuinely no
        // data, go ahead and clear — user needs to see the empty state.
        setLogs(data ?? []);
      }

      if (showSpinner) setLogsLoading(false);
    },
    [supabase] // no longer depends on deviceId — queries all nodes
  );

  // ─────────────────────────────────────────────────────────────────────────
  // refreshData — polls latest sensor log + settings + history
  //   Called by the interval AND the manual "↻ Refresh" button.
  // ─────────────────────────────────────────────────────────────────────────
  const refreshData = useCallback(
    async ({ manual = false } = {}) => {
      setIsRefreshing(true);

      // Fetch latest sensor log ──────────────────────────────────────────────
      const { data: log } = await supabase
        .from("sensor_logs")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // SAFE MERGE: only update if we got a real row.
      // Never pass null to setLatestLog — keeps old values on screen during
      // temporary network hiccups.
      if (log) {
        setLatestLog((prev) => (prev ? { ...prev, ...log } : log));
        setLastUpdatedAt(new Date());
      }

      // Fetch settings ───────────────────────────────────────────────────────
      const { data: s } = await supabase
        .from("settings")
        .select("*")
        .eq("device_id", deviceId)
        .single();

      if (s) {
        setSettings((prev) => (prev ? { ...prev, ...s } : s));
      }

      // Refresh history logs silently (no spinner) ───────────────────────────
      await fetchLogs({ showSpinner: false });

      setIsRefreshing(false);
    },
    [supabase, deviceId, fetchLogs]
  );

  // ── Initial log fetch (with spinner) on mount ─────────────────────────────
  useEffect(() => {
    fetchLogs({ showSpinner: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // ── Re-fetch logs with spinner when user changes mode ─────────────────────
  // We skip the very first render (handled above) by checking if logs exist.
  const logModeInitialized = useRef(false);
  useEffect(() => {
    if (!logModeInitialized.current) {
      logModeInitialized.current = true;
      return; // skip — already handled by the mount effect above
    }
    fetchLogs({ showSpinner: true });
  }, [logMode, fetchLogs]);

  // ── Polling interval — 30 seconds ─────────────────────────────────────────
  // refreshData is stable (no dependency on logMode thanks to logModeRef),
  // so this effect runs ONCE and the interval is never torn down/recreated.
  useEffect(() => {
    const interval = setInterval(() => refreshData(), 30_000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // ── Manual Refresh button ─────────────────────────────────────────────────
  function handleManualRefresh() {
    refreshData({ manual: true });
  }

  // ── Toggle log mode ───────────────────────────────────────────────────────
  function handleLogModeChange(mode) {
    if (mode !== logMode) setLogMode(mode);
  }

  // ── Manual fogger control ─────────────────────────────────────────────────
  async function handleFoggerControl(turnOn) {
    if (!settings) return;
    setControlLoading(true);

    const { data: updated, error } = await supabase
      .from("settings")
      .update({
        fogger_manual_override: true,
        fogger_status: turnOn,
      })
      .eq("device_id", deviceId)
      .select()
      .single();

    if (error) {
      showMessage("err", "Failed to update fogger status.");
    } else {
      setSettings(updated);
      showMessage(
        "ok",
        `Fogger turned ${turnOn ? "ON" : "OFF"} — manual override active.`
      );
    }
    setControlLoading(false);
  }

  async function handleClearOverride() {
    if (!settings) return;
    setControlLoading(true);

    const { data: updated, error } = await supabase
      .from("settings")
      .update({ fogger_manual_override: false })
      .eq("device_id", deviceId)
      .select()
      .single();

    if (error) {
      showMessage("err", "Failed to clear override.");
    } else {
      setSettings(updated);
      showMessage("ok", "Manual override cleared. Automation is now active.");
    }
    setControlLoading(false);
  }

  // ── Save thresholds ───────────────────────────────────────────────────────
  async function handleSaveThresholds(tempThreshold, humidityThreshold) {
    setSettingsSaving(true);

    const { data: updated, error } = await supabase
      .from("settings")
      .update({
        temp_threshold: tempThreshold,
        humidity_threshold: humidityThreshold,
      })
      .eq("device_id", deviceId)
      .select()
      .single();

    if (error) {
      showMessage("err", "Failed to save thresholds.");
    } else {
      setSettings(updated);
      showMessage("ok", "Thresholds saved successfully.");
    }
    setSettingsSaving(false);
  }

  // ── Toast helper ──────────────────────────────────────────────────────────
  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-100">
            {device?.name ?? "Garden Fogger"}
          </h1>
          <p className="text-stone-500 text-xs mt-0.5 font-mono">
            device_id: {deviceId}
          </p>
        </div>

        {/* Refresh button + last-updated indicator */}
        <div className="flex items-center gap-3">
          {lastUpdatedAt && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 font-mono">
              {/* Spinning dot — visible only while a refresh is in flight */}
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isRefreshing
                    ? "bg-leaf-400 animate-pulse"
                    : "bg-stone-600"
                }`}
              />
              {isRefreshing ? "Refreshing…" : `Updated ${formatUpdatedAt(lastUpdatedAt)}`}
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {message && (
        <div
          className={`rounded-lg px-4 py-2.5 text-sm border ${
            message.type === "ok"
              ? "bg-leaf-500/10 border-leaf-500/40 text-leaf-400"
              : "bg-red-900/20 border-red-800 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SensorCard
          log={latestLog}
          foggerStatus={settings?.fogger_status ?? false}
        />
        <ControlCard
          settings={settings}
          loading={controlLoading}
          onTurnOn={() => handleFoggerControl(true)}
          onTurnOff={() => handleFoggerControl(false)}
          onClearOverride={handleClearOverride}
        />
      </div>

      <ThresholdCard
        settings={settings}
        saving={settingsSaving}
        onSave={handleSaveThresholds}
      />

      {/* ── Sensor History Logs ────────────────────────────────────────────── */}
      <div className="card space-y-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-stone-200">Sensor History</h2>
            <p className="text-stone-500 text-xs mt-0.5">
              {logMode === "hour" ? "Showing last 1 hour" : "Showing all records"}
              {" · "}
              {logs.length} {logs.length === 1 ? "entry" : "entries"}
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLogModeChange("hour")}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                logMode === "hour"
                  ? "bg-leaf-500 border-leaf-500 text-white"
                  : "bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200"
              }`}
            >
              1 Hour
            </button>
            <button
              onClick={() => handleLogModeChange("all")}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                logMode === "all"
                  ? "bg-leaf-500 border-leaf-500 text-white"
                  : "bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200"
              }`}
            >
              All Data
            </button>
          </div>
        </div>

        {/* Table — only replaced with skeleton on intentional fetches */}
        {logsLoading ? (
          <div className="text-center py-8 text-stone-500 text-sm animate-pulse">
            Loading…
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-stone-800/40 rounded-lg p-6 text-center">
            <p className="text-stone-500 text-sm">
              {logMode === "hour"
                ? "No readings in the last hour."
                : "No sensor logs found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-lg border border-stone-700/60">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-stone-800 text-stone-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Timestamp</th>
                  <th className="px-4 py-2.5 text-left font-medium">Node</th>
                  <th className="px-4 py-2.5 text-right font-medium">Temp (°C)</th>
                  <th className="px-4 py-2.5 text-right font-medium">Humidity (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {logs.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-stone-900/60 hover:bg-stone-800/60 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-stone-400 text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString([], {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-stone-700 text-stone-300">
                        {row.device_id}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-amber-400">
                      {Number(row.temperature).toFixed(1)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-mist-300">
                      {Number(row.humidity).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
