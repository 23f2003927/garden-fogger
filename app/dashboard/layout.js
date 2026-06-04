import Link from "next/link";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🌱</span>
              <span className="font-bold text-lg text-green-700 tracking-tight">
                SmartFarm
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-6 text-sm">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-green-700 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/spectral"
                className="text-gray-500 hover:text-green-700 font-medium transition-colors"
              >
                Spectral Analysis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer className="text-center text-gray-400 text-xs py-6 border-t border-gray-200">
        SmartFarm — AI-Powered Agronomic Intelligence Platform
      </footer>
    </div>
  );
}
