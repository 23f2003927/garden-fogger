/**
 * lib/supabase/queries.js
 * Reusable, pure query functions for the polyhouse_nodes table.
 * Accepts a supabase client (browser or server) so they work in both contexts.
 */

const NODE_NAMES = ["A", "B", "C"];

/**
 * Fetches the latest reading for each node (A, B, C).
 * Returns an array of rows (or null entries for missing nodes).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<Array<object|null>>}  — array of 3 items, index 0=A, 1=B, 2=C
 */
export async function fetchLatestNodeReadings(supabase) {
  // Fetch the single most-recent row for each node in parallel
  const results = await Promise.all(
    NODE_NAMES.map((name) =>
      supabase
        .from("polyhouse_nodes")
        .select("node_name, temperature, humidity, created_at")
        .eq("node_name", name)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    )
  );

  return results.map((r) => r.data ?? null);
}

/**
 * Determines online/offline status for a reading.
 * Online = latest reading was received within the last 90 seconds.
 *
 * @param {string|null} createdAt  — ISO timestamp string or null
 * @returns {boolean}
 */
export function isNodeOnline(createdAt) {
  if (!createdAt) return false;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs <= 90_000; // 90 seconds
}

/**
 * Calculates average temperature and humidity across available (non-null) nodes.
 *
 * @param {Array<object|null>} readings
 * @returns {{ avgTemp: number|null, avgHumidity: number|null }}
 */
export function calcNodeAverages(readings) {
  const available = readings.filter(Boolean);
  if (available.length === 0) return { avgTemp: null, avgHumidity: null };

  const avgTemp =
    available.reduce((sum, r) => sum + Number(r.temperature), 0) /
    available.length;
  const avgHumidity =
    available.reduce((sum, r) => sum + Number(r.humidity), 0) /
    available.length;

  return { avgTemp, avgHumidity };
}
