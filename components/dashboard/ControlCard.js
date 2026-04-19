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
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-stone-200">Manual Controls</h2>
        {isOverride && (
          <span className="text-xs bg-amber-500/10 border border-amber-500/40 text-amber-400 px-2 py-0.5 rounded-full">
            Override Active
          </span>
        )}
      </div>

      <p className="text-stone-500 text-sm">
        Manually force the fogger state. This overrides automatic threshold
        logic until you clear it.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onTurnOn}
          disabled={loading || (isOverride && foggerOn)}
          className="btn-primary flex-1"
        >
          💧 Turn ON
        </button>
        <button
          onClick={onTurnOff}
          disabled={loading || (isOverride && !foggerOn)}
          className="btn-danger flex-1"
        >
          ⛔ Turn OFF
        </button>
      </div>

      {isOverride && (
        <button
          onClick={onClearOverride}
          disabled={loading}
          className="btn-secondary w-full text-sm"
        >
          ↺ Clear Override (resume automation)
        </button>
      )}

      <div className="bg-stone-800/50 rounded-lg px-3 py-2.5 text-xs text-stone-500 space-y-1">
        <p>
          Mode:{" "}
          <span className={isOverride ? "text-amber-400" : "text-leaf-400"}>
            {isOverride ? "Manual Override" : "Automatic"}
          </span>
        </p>
        <p>
          Fogger:{" "}
          <span className={foggerOn ? "text-mist-300" : "text-stone-500"}>
            {foggerOn ? "ON" : "OFF"}
          </span>
        </p>
      </div>
    </div>
  );
}
