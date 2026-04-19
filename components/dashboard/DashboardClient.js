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
  }, [supabase, deviceId]);

  useEffect(() => {
    const interval = setInterval(refreshData, 10_000);
    return () => clearInterval(interval);
  }, [refreshData]);

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
    </div>
  );
}
