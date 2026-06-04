export default function ControlCard({
  settings,
  loading,
  onTurnOn,
  onTurnOff,
  onClearOverride,
}) {
  const isOverride = settings?.fogger_manual_override ?? false;
  const foggerOn = settings?.fogger_status ?? false;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Manual Controls</h2>
        {isOverride && (
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-600 px-2 py-0.5 rounded-full font-medium">
            Override Active
          </span>
        )}
      </div>

      <p className="text-gray-500 text-sm">
        Manually force the fogger state. This overrides automatic threshold
        logic until you clear it.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onTurnOn}
          disabled={loading || (isOverride && foggerOn)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          💧 Turn ON
        </button>
        <button
          onClick={onTurnOff}
          disabled={loading || (isOverride && !foggerOn)}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⛔ Turn OFF
        </button>
      </div>

      {isOverride && (
        <button
          onClick={onClearOverride}
          disabled={loading}
          className="w-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↺ Clear Override (resume automation)
        </button>
      )}

      <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-xs text-gray-500 space-y-1 border border-gray-100">
        <p>
          Mode:{" "}
          <span className={isOverride ? "text-amber-600 font-medium" : "text-green-600 font-medium"}>
            {isOverride ? "Manual Override" : "Automatic"}
          </span>
        </p>
        <p>
          Fogger:{" "}
          <span className={foggerOn ? "text-cyan-600 font-medium" : "text-gray-400"}>
            {foggerOn ? "ON" : "OFF"}
          </span>
        </p>
      </div>
    </div>
  );
}
