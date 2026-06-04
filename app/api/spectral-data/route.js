import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const {
      node_id,
      violet_415, indigo_445, blue_480, cyan_515,
      green_555, yellow_590, orange_630, red_680,
      clear_channel, nir_channel,
      temperature, humidity,
    } = body;

    if (!node_id) {
      return NextResponse.json(
        { error: "Missing required field: node_id" },
        { status: 400 }
      );
    }

    const row = {
      node_id,
      violet_415: violet_415 ?? null,
      indigo_445: indigo_445 ?? null,
      blue_480: blue_480 ?? null,
      cyan_515: cyan_515 ?? null,
      green_555: green_555 ?? null,
      yellow_590: yellow_590 ?? null,
      orange_630: orange_630 ?? null,
      red_680: red_680 ?? null,
      clear_channel: clear_channel ?? null,
      nir_channel: nir_channel ?? null,
      temperature: temperature ?? null,
      humidity: humidity ?? null,
      raw_json: body,
    };

    const { error: insertError } = await supabase
      .from("spectral_readings")
      .insert(row);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("spectral-data error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
