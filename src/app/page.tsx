import { ArrowRight, BarChart3, Package, Shield } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06080f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-indigo-600/25 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-[480px] w-[480px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 backdrop-blur-md">
          {BRAND_NAME} Platform
        </div>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          {BRAND_NAME}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/55 sm:text-xl">
          The internal operating system for SelfDiscovery — sales, inventory, finance,
          and library management in one secure workspace.
        </p>

        <div className="mt-10">
          {/* Hard navigation avoids flaky App Router soft-nav when middleware runs */}
          <a
            href="/login"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-10 text-sm font-semibold shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-500"
          >
            Sign in to your workspace
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
          <p className="mt-4 text-sm text-white/40">
            New here?{" "}
            <a href="/signup" className="font-medium text-indigo-300 hover:text-indigo-200">
              Create an account
            </a>
          </p>
        </div>

        <div className="mt-16 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[
            { icon: BarChart3, label: "Real-time analytics" },
            { icon: Package, label: "Inventory & sales" },
            { icon: Shield, label: "Secure workspaces" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
            >
              <Icon className="mx-auto mb-3 h-6 w-6 text-indigo-300" />
              <p className="text-sm font-medium text-white/85">{label}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 pb-8 text-center text-sm text-white/35">
        © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
