/**
 * components/dashboard/NodeCard.js
 * Displays a single polyhouse node's latest reading.
 * Matches the existing card/badge styling of the project exactly.
 */

import { isNodeOnline } from "@/lib/supabase/queries";

function formatTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function NodeCard({ nodeName, reading }) {
  const online = isNodeOnline(reading?.created_at ?? null);

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Node {nodeName}</h2>

        {/* Online / Offline badge — mirrors the Fogger badge style */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            online
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-gray-100 border-gray-200 text-gray-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              online ? "bg-green-500 animate-pulse" : "bg-gray-300"
            }`}
          />
          {online ? "Online" : "Offline"}
        </span>
      </div>

      {reading ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Temperature */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                Temperature
              </p>
              <p className="font-mono text-3xl font-bold text-amber-600">
                {Number(reading.temperature).toFixed(1)}
                <span className="text-lg text-amber-400">°C</span>
              </p>
            </div>

            {/* Humidity */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                Humidity
              </p>
              <p className="font-mono text-3xl font-bold text-cyan-600">
                {Number(reading.humidity).toFixed(1)}
                <span className="text-lg text-cyan-400">%</span>
              </p>
            </div>
          </div>

          <p className="text-gray-400 text-xs text-right font-mono">
            Last reading: {formatTime(reading.created_at)}
          </p>
        </>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
          <p className="text-gray-500 text-sm">No data yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Waiting for Node {nodeName} to send readings…
          </p>
        </div>
      )}
    </div>
  );
}
