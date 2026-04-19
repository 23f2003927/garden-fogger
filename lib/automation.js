/**
 * Decides whether the fogger should be ON.
 *
 * @param {{ temperature: number, humidity: number }} log
 * @param {{ temp_threshold: number, humidity_threshold: number, fogger_manual_override: boolean, fogger_status: boolean }} settings
 * @returns {boolean}
 */
export function computeFoggerStatus(log, settings) {
  // Manual override takes full priority
  if (settings.fogger_manual_override) {
    return settings.fogger_status;
  }

  // Automatic: ON if temp too high OR humidity too low
  return (
    log.temperature > settings.temp_threshold ||
    log.humidity < settings.humidity_threshold
  );
}
