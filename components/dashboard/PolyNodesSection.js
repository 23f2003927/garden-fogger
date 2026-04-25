"use client";

/**
 * components/dashboard/PolyNodesSection.js
 * Client component that polls polyhouse_nodes every 15 seconds and
 * renders Node A / B / C cards + average stats.
 *
 * Props:
 *   initialReadings — array of 3 items (A, B, C) from SSR, may contain nulls
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchLatestNodeReadings,
  calcNodeAverages,
  isNodeOnline,
} from "@/lib/supabase/queries";
import NodeCard from "./NodeCard";

const NODE_NAMES = ["A", "B", "C"];

// ─────────────────────────────────────────────────────────────────────────────
// Small stat tile used for the averages row
// ─────────────────────────────────────────────────────────────────────────────
function StatTile({ label, value, unit, colorClass }) {
  return (
    <div className="bg-stone-800/60 rounded-lg p-4 text-center flex-1">
      <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">
        {label}
      </p>
      {value !== null ? (
        <p className={`font-mono text-3xl font-bold ${colorClass}`}>
          {value.toFixed(1)}
          <span className="text-lg opacity-70">{unit}</span>
        </p>
      ) : (
        <p className="text-stone-600 text-sm mt-1">—</p>
      )}
    </div>
  );
}

export default function PolyNodesSection({ initialReadings }) {
  const supabase = useMemo(() => createClient(), []);

  // readings[0] = Node A, readings[1] = Node B, readings[2] = Node C
  const [readings, setReadings] = useState(initialReadings ?? [null, null, null]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch latest readings for all nodes ────────────────────────────────────
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    const fresh = await fetchLatestNodeReadings(supabase);

    // Safe merge: keep the previous value for a node if the new fetch returned
    // null (e.g. temporary network hiccup) so cards don't flash empty.
    setReadings((prev) =>
      fresh.map((r, i) => r ?? prev[i] ?? null)
    );

    setIsRefreshing(false);
  }, [supabase]);

  // ── Auto-refresh every 15 seconds ─────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  // ── Calculate averages ─────────────────────────────────────────────────────
  const { avgTemp, avgHumidity } = useMemo(
    () => calcNodeAverages(readings),
    [readings]
  );

  // Count how many nodes are currently online
  const onlineCount = readings.filter(
    (r) => r && isNodeOnline(r.created_at)
  ).length;

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-100">
            Polyhouse Sensor Nodes
          </h2>
          <p className="text-stone-500 text-xs mt-0.5 font-mono">
            {onlineCount} / {NODE_NAMES.length} nodes online · auto-refresh
            every 15s
          </p>
        </div>

        {/* Subtle live indicator — mirrors the existing refresh dot */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-mono text-stone-500 ${
            isRefreshing ? "opacity-100" : "opacity-50"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isRefreshing ? "bg-leaf-400 animate-pulse" : "bg-stone-600"
            }`}
          />
          {isRefreshing ? "Refreshing…" : "Live"}
        </span>
      </div>

      {/* Error banner — only shown when a refresh explicitly fails */}
      {error && (
        <div className="rounded-lg px-4 py-2.5 text-sm border bg-red-900/20 border-red-800 text-red-400">
          {error}
        </div>
      )}

      {/* Node cards — 1-col on mobile, 3-col on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {NODE_NAMES.map((name, i) => (
          <NodeCard key={name} nodeName={name} reading={readings[i]} />
        ))}
      </div>

      {/* Averages row */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-stone-200">Polyhouse Averages</h3>
          <span className="text-xs text-stone-500 font-mono">
            {readings.filter(Boolean).length} node
            {readings.filter(Boolean).length !== 1 ? "s" : ""} with data
          </span>
        </div>

        <div className="flex gap-3">
          <StatTile
            label="Avg Temperature"
            value={avgTemp}
            unit="°C"
            colorClass="text-amber-400"
          />
          <StatTile
            label="Avg Humidity"
            value={avgHumidity}
            unit="%"
            colorClass="text-mist-300"
          />
        </div>

        {readings.filter(Boolean).length === 0 && (
          <p className="text-stone-600 text-xs text-center">
            No node data available yet.
          </p>
        )}
      </div>
    </div>
  );
}
