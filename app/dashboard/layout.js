import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LogoutButton from "@/components/dashboard/LogoutButton";

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-stone-800 bg-stone-950 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-mono text-leaf-400 font-bold tracking-tight">
              Garden Fogger
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-stone-500 text-xs hidden sm:block truncate max-w-[180px]">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="text-center text-stone-700 text-xs py-4">
        Garden Fogger Control Panel — ESP32 System
      </footer>
    </div>
  );
}
