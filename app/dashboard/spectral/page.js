import { createClient } from "@/lib/supabase/server";
import SpectralClient from "@/components/dashboard/SpectralClient";

export const revalidate = 0;

export const metadata = {
  title: "Spectral Analysis — SmartFarm",
  description: "Live spectral sensor data from the Adafruit AS7341 10-channel spectral sensor.",
};

export default async function SpectralPage() {
  const supabase = createClient();

  // Fetch the latest spectral reading for SSR hydration
  const { data: latestReading } = await supabase
    .from("spectral_readings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch last 50 readings for the historical chart
  const { data: recentReadings } = await supabase
    .from("spectral_readings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <SpectralClient
      initialReading={latestReading ?? null}
      initialHistory={(recentReadings ?? []).reverse()}
    />
  );
}
