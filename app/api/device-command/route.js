import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const device_id = searchParams.get("device_id");

    if (!device_id) {
      return NextResponse.json(
        { error: "Missing device_id query param" },
        { status: 400 }
      );
    }

    const { data: settings, error } = await supabase
      .from("settings")
      .select("fogger_status, temp_threshold")
      .eq("device_id", device_id)
      .single();

    if (error || !settings) {
      // Default to OFF when no settings row exists yet
      return NextResponse.json({ fogger: false });
    }

    return NextResponse.json({
      fogger: settings.fogger_status,
      temp_threshold: settings.temp_threshold,
    });

    // return NextResponse.json({ fogger: settings.fogger_status });
  } catch (err) {
    console.error("device-command error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
