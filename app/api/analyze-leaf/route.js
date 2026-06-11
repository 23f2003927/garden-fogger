import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeLeafData } from "@/lib/leaf-analysis";

// Service-role client — bypasses RLS to query latest reading
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET: Analyzes the latest reading stored in Supabase
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("spectral_readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({
        success: false,
        error: "No spectral readings found in the database."
      }, { status: 404 });
    }

    const analysis = analyzeLeafData(data);

    return NextResponse.json({
      success: true,
      timestamp: data.created_at,
      readingId: data.id,
      reading: {
        f1_415nm: data.f1_415nm,
        f2_445nm: data.f2_445nm,
        f3_480nm: data.f3_480nm,
        f4_515nm: data.f4_515nm,
        f5_555nm: data.f5_555nm,
        f6_590nm: data.f6_590nm,
        f7_630nm: data.f7_630nm,
        f8_680nm: data.f8_680nm,
        clear: data.clear,
        nir: data.nir
      },
      analysis
    });
  } catch (err) {
    console.error("GET analyze-leaf error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Analyzes a reading sent in the request body
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({
        success: false,
        error: "Missing spectral data in the body."
      }, { status: 400 });
    }

    const analysis = analyzeLeafData(body);

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error("POST analyze-leaf error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
