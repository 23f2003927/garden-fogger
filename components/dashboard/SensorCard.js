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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Sensor Data</h2>

        {/* Fogger status badge */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            foggerStatus
              ? "bg-cyan-50 border-cyan-200 text-cyan-700"
              : "bg-gray-50 border-gray-200 text-gray-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              foggerStatus ? "bg-cyan-500 animate-pulse" : "bg-gray-300"
            }`}
          />
          Fogger {foggerStatus ? "ON" : "OFF"}
        </span>
      </div>

      {log ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Temperature */}
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                Temperature
              </p>
              <p className="font-mono text-3xl font-bold text-amber-600">
                {Number(log.temperature).toFixed(1)}
                <span className="text-lg text-amber-400">°C</span>
              </p>
            </div>

            {/* Humidity */}
            <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                Humidity
              </p>
              <p className="font-mono text-3xl font-bold text-cyan-600">
                {Number(log.humidity).toFixed(1)}
                <span className="text-lg text-cyan-400">%</span>
              </p>
            </div>
          </div>

          <p className="text-gray-400 text-xs text-right font-mono">
            Last updated: {formatTime(log.created_at)}
          </p>
        </>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-400 text-sm">No sensor data yet.</p>
          <p className="text-gray-300 text-xs mt-1">
            Waiting for ESP32 to send readings…
          </p>
        </div>
      )}
    </div>
  );
}
