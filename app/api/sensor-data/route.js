import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeFoggerStatus } from "@/lib/automation";

// Service-role client — bypasses RLS so ESP32 can write without a user session
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Verify shared secret sent by ESP32
    const secret = request.headers.get("x-api-secret");
    if (process.env.ESP32_API_SECRET && secret !== process.env.ESP32_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { device_id, temperature, humidity } = body;

    if (!device_id || temperature == null || humidity == null) {
      return NextResponse.json(
        { error: "Missing required fields: device_id, temperature, humidity" },
        { status: 400 }
      );
    }

    // 1. Insert sensor log
    const { error: logError } = await supabase
      .from("sensor_logs")
      .insert({ device_id, temperature, humidity });

    if (logError) throw logError;

    // 2. Fetch current settings for this device
    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("*")
      .eq("device_id", device_id)
      .single();

    if (settingsError || !settings) {
      // No settings yet — acknowledge and return default OFF
      return NextResponse.json({ success: true, fogger: false });
    }

    // 3. Compute desired fogger state via automation logic
    const foggerOn = computeFoggerStatus({ temperature, humidity }, settings);

    // 4. Persist new fogger_status only when NOT in manual override
    if (!settings.fogger_manual_override) {
      await supabase
        .from("settings")
        .update({ fogger_status: foggerOn })
        .eq("device_id", device_id);
    }

    return NextResponse.json({ success: true, fogger: foggerOn });
  } catch (err) {
    console.error("sensor-data error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
