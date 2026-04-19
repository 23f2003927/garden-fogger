import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard/DashboardClient";

const DEFAULT_DEVICE_ID = "garden_1";

export const revalidate = 0; // always fetch fresh

export default async function DashboardPage() {
  const supabase = createClient();

  // 1. Ensure device row exists
  let { data: device } = await supabase
    .from("devices")
    .select("*")
    .eq("device_id", DEFAULT_DEVICE_ID)
    .single();

  if (!device) {
    const { data: newDevice } = await supabase
      .from("devices")
      .insert({ name: "Garden Fogger #1", device_id: DEFAULT_DEVICE_ID })
      .select()
      .single();
    device = newDevice;
  }

  // 2. Ensure settings row exists
  let { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("device_id", DEFAULT_DEVICE_ID)
    .single();

  if (!settings) {
    const { data: newSettings } = await supabase
      .from("settings")
      .insert({
        device_id: DEFAULT_DEVICE_ID,
        temp_threshold: 35,
        humidity_threshold: 40,
        fogger_manual_override: false,
        fogger_status: false,
      })
      .select()
      .single();
    settings = newSettings;
  }

  // 3. Fetch latest sensor log
  const { data: latestLog } = await supabase
    .from("sensor_logs")
    .select("*")
    .eq("device_id", DEFAULT_DEVICE_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <DashboardClient
      device={device}
      initialLog={latestLog ?? null}
      initialSettings={settings}
    />
  );
}
