import { LucideIcon } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
  headline: string;
  headlineAccent: string;
  description: string;
  badges?: { label: string; icon: LucideIcon }[];
}

export function AuthShell({
  children,
  headline,
  headlineAccent,
  description,
  badges = [],
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06080f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-indigo-600/25 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-[480px] w-[480px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:flex-row lg:items-center lg:gap-16 lg:px-10">
        <div className="mb-10 order-2 flex flex-1 flex-col justify-center lg:order-1 lg:mb-0">
          <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
            SelfDiscovery™ Platform
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[3.25rem]">
            {headline}
            <span className="block bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-300 bg-clip-text text-transparent">
              {headlineAccent}
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
            {description}
          </p>

          {badges.length > 0 && (
            <div className="mt-10 hidden gap-4 lg:grid lg:grid-cols-3">
              {badges.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
                >
                  <Icon className="mb-2 h-5 w-5 text-indigo-300" />
                  <p className="text-sm font-medium text-white/90">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="order-1 w-full max-w-md shrink-0 lg:order-2 lg:max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthCard({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
      <div className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <div className="h-5 w-5 rounded-md bg-white/90" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1.5 text-sm text-white/55">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export const authInputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/25";

export const authButtonClass =
  "group mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60";
