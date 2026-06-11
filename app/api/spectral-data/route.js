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
    
    // Support both old keys and new keys
    const f1 = body.f1_415nm ?? body.violet_415;
    const f2 = body.f2_445nm ?? body.indigo_445;
    const f3 = body.f3_480nm ?? body.blue_480;
    const f4 = body.f4_515nm ?? body.cyan_515;
    const f5 = body.f5_555nm ?? body.green_555;
    const f6 = body.f6_590nm ?? body.yellow_590;
    const f7 = body.f7_630nm ?? body.orange_630;
    const f8 = body.f8_680nm ?? body.red_680;
    const cl = body.clear ?? body.clear_channel;
    const nir = body.nir ?? body.nir_channel;

    const row = {
      f1_415nm: f1 ?? null,
      f2_445nm: f2 ?? null,
      f3_480nm: f3 ?? null,
      f4_515nm: f4 ?? null,
      f5_555nm: f5 ?? null,
      f6_590nm: f6 ?? null,
      f7_630nm: f7 ?? null,
      f8_680nm: f8 ?? null,
      clear: cl ?? null,
      nir: nir ?? null,
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
