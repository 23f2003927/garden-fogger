"use client";

import { useState, useEffect } from "react";

export default function ThresholdCard({ settings, saving, onSave }) {
  const [tempThreshold, setTempThreshold] = useState(
    settings?.temp_threshold ?? 35
  );
  const [humidityThreshold, setHumidityThreshold] = useState(
    settings?.humidity_threshold ?? 40
  );

  // Keep local state in sync when settings change after a refresh
  useEffect(() => {
    if (settings) {
      setTempThreshold(settings.temp_threshold);
      setHumidityThreshold(settings.humidity_threshold);
    }
  }, [settings]);

  function handleSave(e) {
    e.preventDefault();
    onSave(Number(tempThreshold), Number(humidityThreshold));
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-stone-200 mb-1">
        Automation Thresholds
      </h2>
      <p className="text-stone-500 text-sm mb-5">
        Fogger turns{" "}
        <strong className="text-stone-300">ON automatically</strong> when
        temperature exceeds the max threshold{" "}
        <em>or</em> humidity drops below the min threshold.
      </p>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 sm:grid-cols-2 gap-5"
      >
        {/* Temperature threshold */}
        <div>
          <label className="label" htmlFor="temp-threshold">
            Max Temperature (°C)
          </label>
          <input
            id="temp-threshold"
            type="number"
            step="0.5"
            min={0}
            max={80}
            required
            className="input-field font-mono"
            value={tempThreshold}
            onChange={(e) => setTempThreshold(e.target.value)}
          />
          <p className="text-stone-600 text-xs mt-1">
            Fogger ON when temp &gt; {tempThreshold}°C
          </p>
        </div>

        {/* Humidity threshold */}
        <div>
          <label className="label" htmlFor="humidity-threshold">
            Min Humidity (%)
          </label>
          <input
            id="humidity-threshold"
            type="number"
            step="1"
            min={0}
            max={100}
            required
            className="input-field font-mono"
            value={humidityThreshold}
            onChange={(e) => setHumidityThreshold(e.target.value)}
          />
          <p className="text-stone-600 text-xs mt-1">
            Fogger ON when humidity &lt; {humidityThreshold}%
          </p>
        </div>

        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "💾 Save Thresholds"}
          </button>
        </div>
      </form>
    </div>
  );
}
