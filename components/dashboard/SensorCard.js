function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function SensorCard({ log, foggerStatus }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-stone-200">Sensor Data</h2>

        {/* Fogger status badge */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            foggerStatus
              ? "bg-mist-300/10 border-mist-300/40 text-mist-300"
              : "bg-stone-800 border-stone-700 text-stone-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              foggerStatus ? "bg-mist-300 animate-pulse" : "bg-stone-600"
            }`}
          />
          Fogger {foggerStatus ? "ON" : "OFF"}
        </span>
      </div>

      {log ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Temperature */}
            <div className="bg-stone-800/60 rounded-lg p-4 text-center">
              <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">
                Temperature
              </p>
              <p className="font-mono text-3xl font-bold text-amber-400">
                {Number(log.temperature).toFixed(1)}
                <span className="text-lg text-amber-500/70">°C</span>
              </p>
            </div>

            {/* Humidity */}
            <div className="bg-stone-800/60 rounded-lg p-4 text-center">
              <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">
                Humidity
              </p>
              <p className="font-mono text-3xl font-bold text-mist-300">
                {Number(log.humidity).toFixed(1)}
                <span className="text-lg text-mist-400/70">%</span>
              </p>
            </div>
          </div>

          <p className="text-stone-600 text-xs text-right font-mono">
            Last updated: {formatTime(log.created_at)}
          </p>
        </>
      ) : (
        <div className="bg-stone-800/40 rounded-lg p-6 text-center">
          <p className="text-stone-500 text-sm">No sensor data yet.</p>
          <p className="text-stone-600 text-xs mt-1">
            Waiting for ESP32 to send readings…
          </p>
        </div>
      )}
    </div>
  );
}
