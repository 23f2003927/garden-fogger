"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import SensorCard from "./SensorCard";
import ControlCard from "./ControlCard";
import ThresholdCard from "./ThresholdCard";

export default function DashboardClient({ device, initialLog, initialSettings }) {
  const supabase = createClient();
  const deviceId = device?.device_id ?? "garden_1";

  const [latestLog, setLatestLog] = useState(initialLog);
  const [settings, setSettings] = useState(initialSettings);
  const [controlLoading, setControlLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok"|"err", text: string }

  // ── Sensor history logs ───────────────────────────────────────────────────
  const [logs, setLogs] = useState([]);
  const [logMode, setLogMode] = useState("hour"); // "hour" | "all"
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Fetch sensor history logs ─────────────────────────────────────────────
  const fetchLogs = useCallback(
    async (mode) => {
      setLogsLoading(true);
      let query = supabase
        .from("sensor_logs")
        .select("id, temperature, humidity, created_at")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false });

      if (mode === "hour") {
        // Filter to the last 60 minutes
        const oneHourAgo = new Date(
          Date.now() - 60 * 60 * 1000
        ).toISOString();
        query = query.gte("created_at", oneHourAgo);
      }

      const { data } = await query;
      if (data) setLogs(data);
      setLogsLoading(false);
    },
    [supabase, deviceId]
  );

  // ── Auto-refresh sensor data every 10 seconds ─────────────────────────────
  const refreshData = useCallback(async () => {
    const { data: log } = await supabase
      .from("sensor_logs")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (log) setLatestLog(log);

    const { data: s } = await supabase
      .from("settings")
      .select("*")
      .eq("device_id", deviceId)
      .single();

    if (s) setSettings(s);

    // Also refresh the history logs
    await fetchLogs(logMode);
  }, [supabase, deviceId, fetchLogs, logMode]);

  // Initial load of logs
  useEffect(() => {
    fetchLogs(logMode);
  }, [fetchLogs, logMode]);

  useEffect(() => {
    const interval = setInterval(refreshData, 10_000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // When user switches mode, fetch immediately
  function handleLogModeChange(mode) {
    setLogMode(mode);
    // fetchLogs will be triggered by the useEffect above
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
        <button onClick={refreshData} className="btn-secondary text-sm py-1.5 px-3">
          ↻ Refresh
        </button>
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

      {/* ── Sensor History Logs ─────────────────────────────────────────── */}
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

        {/* Table */}
        {logsLoading ? (
          <div className="text-center py-8 text-stone-500 text-sm">Loading…</div>
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
